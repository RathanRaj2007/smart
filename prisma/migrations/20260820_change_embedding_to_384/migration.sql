-- Migration: Change DocumentChunk.embedding from vector(1536) to vector(384)
--
-- SAFETY: This migration ONLY modifies the embedding COLUMN.
-- It does NOT delete any rows from DocumentChunk or Document.
-- All chunk text (content), documentId, chunkIndex, and other fields are preserved.
-- Only the embedding values are dropped and the column is recreated at 384 dimensions.
-- Existing embeddings (1536-dim) are incompatible with the new 384-dim model
-- and will be rebuilt by the local re-embedding script after migration.

-- Step 1: Drop the old vector(1536) column (old embeddings are lost, rows preserved)
ALTER TABLE "DocumentChunk" DROP COLUMN IF EXISTS "embedding";

-- Step 2: Add new vector(384) column for all-MiniLM-L6-v2
ALTER TABLE "DocumentChunk" ADD COLUMN "embedding" vector(384);

-- Step 3: Drop any old IVFFlat/HNSW index that was tied to the old 1536-dim column
DROP INDEX IF EXISTS "DocumentChunk_embedding_idx";

-- (Optional) Create an HNSW index for fast approximate nearest neighbor search
-- Enable this once chunks are re-embedded (can be done separately).
-- CREATE INDEX ON "DocumentChunk" USING hnsw ("embedding" vector_cosine_ops);
