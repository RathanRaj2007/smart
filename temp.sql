CREATE INDEX IF NOT EXISTS documentchunk_embedding_idx ON "DocumentChunk" USING hnsw (embedding vector_cosine_ops);
