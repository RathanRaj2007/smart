EXPLAIN ANALYZE SELECT dc.id FROM "DocumentChunk" dc ORDER BY dc.embedding <=> array_fill(0.1, ARRAY[384])::vector LIMIT 5;
