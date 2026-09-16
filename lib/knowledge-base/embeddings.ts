/**
 * Local embedding generation using @xenova/transformers
 * Model: sentence-transformers/all-MiniLM-L6-v2 (384-dimensional)
 *
 * - Runs entirely in the Node.js process (zero API calls, zero cost)
 * - Model is downloaded once on first use, then cached locally
 * - No OpenAI, no mock/random vectors, no external embedding API
 */

export const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2'
export const EMBEDDING_DIMENSIONS = 384

// Process-level singleton — model is loaded once and reused across all calls
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _pipeline: any = null

/**
 * Load (or return cached) embedding pipeline.
 * On first call, downloads the model weights (~23 MB) to the local cache.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getEmbeddingPipeline(): Promise<any> {
  if (!_pipeline) {
    const { pipeline } = await import('@xenova/transformers')
    console.log('[embeddings] Loading local model: Xenova/all-MiniLM-L6-v2 ...')
    _pipeline = await pipeline('feature-extraction', EMBEDDING_MODEL, {
      // Suppress informational logs from the transformers library
      progress_callback: undefined,
    })
    console.log('[embeddings] Model loaded successfully')
  }
  return _pipeline
}

/**
 * Convert raw pipeline output (nested Float32Array/Array) to a plain number[].
 * The pipeline returns shape [1, sequence_length, 384]; we mean-pool to [384].
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toVector(output: any): number[] {
  // output.data is a flat Float32Array of shape [1 * seq_len * 384]
  // output dims: [batch=1, seq_len, hidden=384]
  const data: Float32Array = output.data
  const dims: number[] = output.dims as number[]

  if (!data || !dims || dims.length < 3) {
    // Fallback: if dims not available, assume already pooled to 384
    const arr = Array.from(data ?? output)
    if (arr.length === EMBEDDING_DIMENSIONS) return arr as number[]
    throw new Error(`[embeddings] Unexpected output shape: dims=${JSON.stringify(dims)}`)
  }

  const [, seqLen, hidden] = dims
  if (hidden !== EMBEDDING_DIMENSIONS) {
    throw new Error(`[embeddings] Unexpected hidden dim: ${hidden}, expected ${EMBEDDING_DIMENSIONS}`)
  }

  // Mean pooling over sequence dimension
  const pooled = new Array<number>(hidden).fill(0)
  for (let tok = 0; tok < seqLen; tok++) {
    for (let h = 0; h < hidden; h++) {
      pooled[h] += data[tok * hidden + h]
    }
  }
  for (let h = 0; h < hidden; h++) {
    pooled[h] /= seqLen
  }

  return pooled
}

/**
 * Normalize a vector to unit length (required for cosine similarity via pgvector).
 */
function normalizeVector(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0))
  if (norm === 0) return vec
  return vec.map((v) => v / norm)
}

/**
 * Generate a 384-dimensional embedding for a single text string.
 * Returns a unit-normalized number[] suitable for pgvector cosine search.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('[embeddings] Cannot generate embedding for empty text')
  }

  const pipe = await getEmbeddingPipeline()
  const output = await pipe(text, { pooling: 'mean', normalize: true })

  // Try the convenient accessor first (newer @xenova/transformers returns it pooled)
  let vec: number[]
  if (output && typeof output.tolist === 'function') {
    // Flattened 1-D already
    const list = output.tolist()
    // tolist() may return [[...]] (2-D with batch dim) or [...] (1-D)
    vec = Array.isArray(list[0]) ? (list[0] as number[]) : (list as number[])
  } else {
    vec = toVector(output)
  }

  if (vec.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `[embeddings] Dimension mismatch: got ${vec.length}, expected ${EMBEDDING_DIMENSIONS}`
    )
  }

  // Normalize for cosine similarity (pipeline may already do this when normalize:true)
  return normalizeVector(vec)
}

/**
 * Generate 384-dimensional embeddings for a batch of texts.
 * Processes in chunks of BATCH_SIZE to manage memory.
 * Returns number[][] in the same order as the input.
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  const BATCH_SIZE = 32 // balance throughput vs memory for MiniLM
  const results: number[][] = []

  console.log(`[embeddings] Generating embeddings for ${texts.length} chunks (batches of ${BATCH_SIZE})`)

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const batchEmbeddings = await Promise.all(batch.map((t) => generateEmbedding(t)))
    results.push(...batchEmbeddings)

    if (i % (BATCH_SIZE * 4) === 0 && i > 0) {
      console.log(`[embeddings]   ... ${i}/${texts.length} done`)
    }
  }

  console.log(`[embeddings] Generated ${results.length} embeddings. Dimension: ${EMBEDDING_DIMENSIONS}`)
  return results
}
