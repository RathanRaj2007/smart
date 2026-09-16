import prisma from '@/lib/db'
import { generateEmbedding } from './embeddings'

export interface SearchResult {
  chunkId: number
  documentId: number
  documentName: string
  originalFilename: string
  chunkIndex: number
  content: string
  similarity: number
}

/**
 * Perform semantic similarity search against DocumentChunk embeddings.
 *
 * - Generates an embedding for the query using the same local model (all-MiniLM-L6-v2).
 * - Uses pgvector's cosine distance operator (<=>) in PostgreSQL.
 * - Filters to only chunks belonging to documents owned by the given user.
 * - Returns top K results sorted by similarity (highest first).
 *
 * @param query  Natural-language search query
 * @param userId Authenticated user's ID (ownership filter)
 * @param topK   Number of results to return (default 5)
 */
export async function searchChunks(
  query: string,
  userId: number,
  topK = 5,
  documentIds?: number[]
): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) {
    throw new Error('Search query cannot be empty')
  }

  // Generate query embedding using the SAME model as document embeddings
  const queryEmbedding = await generateEmbedding(query)
  const vectorStr = `[${queryEmbedding.join(',')}]`
  
  let docFilter = ''
  if (documentIds && documentIds.length > 0) {
    const ids = documentIds.join(',')
    docFilter = `AND d."id" IN (${ids})`
  }

  // pgvector cosine distance: 1 - cosine_distance = cosine_similarity
  // The <=> operator returns cosine distance (0 = identical, 2 = opposite)
  // We compute similarity as (1 - distance) so higher = more similar
  const results = await prisma.$queryRawUnsafe<
    Array<{
      chunk_id: number
      document_id: number
      document_name: string
      original_filename: string
      chunk_index: number
      content: string
      distance: number
    }>
  >(
    `
    SELECT
      dc."id"                AS chunk_id,
      dc."documentId"        AS document_id,
      d."name"               AS document_name,
      d."originalFilename"   AS original_filename,
      dc."chunkIndex"        AS chunk_index,
      dc."content"           AS content,
      (dc."embedding" <=> $1::vector) AS distance
    FROM "DocumentChunk" dc
    JOIN "Document" d ON d."id" = dc."documentId"
    WHERE d."userId" = $2
      AND dc."embedding" IS NOT NULL
      ${docFilter}
    ORDER BY dc."embedding" <=> $1::vector ASC
    LIMIT $3
    `,
    vectorStr,
    userId,
    topK
  )

  return results.map((r) => ({
    chunkId: r.chunk_id,
    documentId: r.document_id,
    documentName: r.document_name,
    originalFilename: r.original_filename,
    chunkIndex: r.chunk_index,
    content: r.content,
    similarity: Math.round((1 - Number(r.distance)) * 10000) / 10000,
  }))
}

export default searchChunks
