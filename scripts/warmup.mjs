/**
 * Development-only safe startup warm-up script for Next.js app.
 * Automatically requests GET page routes after server availability.
 */

const BASE_URL = process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:3000'
const READINESS_TIMEOUT_MS = 60000
const OVERALL_TIMEOUT_MS = 120000
const CONCURRENCY_LIMIT = 2

const ROUTES = [
  '/',
  '/login',
  '/dashboard',
  '/interview',
  '/candidate',
  '/report',
  '/suggestions',
  '/knowledge-base',
  '/settings',
  '/admin',
  '/admin/users',
  '/admin/interviews',
  '/admin/candidates',
  '/admin/analytics',
  '/admin/audit-logs',
]

async function isServerReady() {
  try {
    const res = await fetch(`${BASE_URL}/`, {
      method: 'GET',
      redirect: 'manual',
      headers: { 'User-Agent': 'SmartInterview-Warmup' },
    })
    return res !== null
  } catch {
    return false
  }
}

async function waitForServer() {
  console.log('[Warmup] Waiting for Next.js...')
  // Initial delay to allow Next.js dev server to initialize .next cleanly on Windows
  await new Promise((r) => setTimeout(r, 3000))
  const start = Date.now()
  while (Date.now() - start < READINESS_TIMEOUT_MS) {
    if (await isServerReady()) {
      console.log('[Warmup] Next.js is ready.')
      return true
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  console.log('[Warmup] Server readiness timeout reached.')
  return false
}

async function warmRoute(route) {
  console.log(`[Warmup] Warming ${route}`)
  try {
    await fetch(`${BASE_URL}${route}`, {
      method: 'GET',
      redirect: 'manual',
      headers: { 'User-Agent': 'SmartInterview-Warmup' },
    })
  } catch {
    // Catch fetch error silently so warm-up never crashes Next.js
  }
}

async function pool(items, limit, fn) {
  const executing = new Set()
  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item))
    executing.add(p)
    const clean = () => executing.delete(p)
    p.then(clean, clean)
    if (executing.size >= limit) {
      await Promise.race(executing)
    }
  }
  await Promise.all(executing)
}

async function main() {
  const timer = setTimeout(() => {
    console.log('[Warmup] Overall timeout reached.')
    process.exit(0)
  }, OVERALL_TIMEOUT_MS)

  try {
    const ready = await waitForServer()
    if (ready) {
      await pool(ROUTES, CONCURRENCY_LIMIT, warmRoute)
    }
  } catch {
    // Catch top-level error silently
  } finally {
    clearTimeout(timer)
    console.log('[Warmup] Completed.')
    process.exit(0)
  }
}

main()
