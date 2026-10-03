import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import prisma from './lib/db';
import { extractTextFromFile } from './lib/knowledge-base/extractText';
import { generateEmbeddingsBatch } from './lib/knowledge-base/embeddings';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380';
const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

function splitIntoChunks(text: string, chunkSize = 1200, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    if (end === text.length) break;
    start += chunkSize - overlap;
  }
  return chunks.filter((c) => c.length > 0);
}

const worker = new Worker('document-processing', async (job: Job) => {
  const { documentId } = job.data;
  console.log(`[Worker] Starting job for document ID: ${documentId}`);
  
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error('Document not found');

  await prisma.document.update({
    where: { id: documentId },
    data: { status: 'PROCESSING' },
  });

  try {
    const extracted = await extractTextFromFile(doc.storagePath);
    const chunkTexts = splitIntoChunks(extracted);

    if (chunkTexts.length === 0) throw new Error('Text splitting produced zero chunks');

    await prisma.$transaction(async (tx) => {
      await tx.documentChunk.deleteMany({ where: { documentId } });
      await tx.documentChunk.createMany({
        data: chunkTexts.map((content, chunkIndex) => ({
          documentId,
          content,
          chunkIndex,
        })),
      });
    });

    console.log(`[Worker] Doc ${documentId} Chunk count: ${chunkTexts.length}`);

    // Process embeddings in controlled batches using existing Xenova/transformers.js
    const embeddings = await generateEmbeddingsBatch(chunkTexts);
    console.log(`[Worker] Doc ${documentId} Embedding generation completed`);

    const savedChunks = await prisma.documentChunk.findMany({
      where: { documentId },
      orderBy: { chunkIndex: 'asc' },
      select: { id: true, chunkIndex: true },
    });

    if (savedChunks.length !== embeddings.length) {
      throw new Error(`Chunk/embedding count mismatch: ${savedChunks.length} chunks vs ${embeddings.length} embeddings`);
    }

    const updatePromises = savedChunks.map((chunk, i) => {
      const vector = embeddings[i];
      const vectorStr = `[${vector.join(',')}]`;
      return prisma.$executeRawUnsafe(
        `UPDATE "DocumentChunk" SET "embedding" = $1::vector WHERE "id" = $2`,
        vectorStr,
        chunk.id
      );
    });
    
    // Controlled batch execution to avoid blowing up DB connection limits
    const CHUNK_SIZE = 50;
    for (let i = 0; i < updatePromises.length; i += CHUNK_SIZE) {
      const batch = updatePromises.slice(i, i + CHUNK_SIZE);
      await prisma.$transaction(batch);
    }

    console.log(`[Worker] Doc ${documentId}: stored ${embeddings.length} embeddings successfully`);

    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'PROCESSED' },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Processing failed';
    console.error(`[Worker] FAILED for doc ${documentId}:`, err);

    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'FAILED' },
    }).catch(() => {});

    throw new Error(message);
  }
}, {
  connection,
  concurrency: 1, // Prevent CPU freezing by running one document at a time
});

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.log(`[Worker] Job ${job?.id} failed with error: ${err.message}`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('[Worker] Shutting down gracefully...');
  await worker.close();
  connection.disconnect();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('[Worker] Started and listening for jobs...');
