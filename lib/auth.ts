import { SessionOptions, getIronSession } from 'iron-session'
import { cookies } from 'next/headers'

declare global {
  var __SERVER_INSTANCE_ID: string | undefined;
}

// Generate a unique ID for this Node.js server instance.
// Using globalThis ensures it survives Next.js dev server hot module reloading.
export function getServerInstanceId() {
  if (typeof process !== 'undefined' && process.release?.name === 'node') {
    if (!globalThis.__SERVER_INSTANCE_ID) {
      globalThis.__SERVER_INSTANCE_ID = `instance-${Date.now()}-${Math.floor(Math.random() * 1000000)}`
    }
    return globalThis.__SERVER_INSTANCE_ID
  }
  return 'edge-ignored'
}

export interface SessionData {
  userId?: number
  username?: string
  role?: string
  isLoggedIn: boolean
  instanceId?: string
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'smartinterview_session',
  cookieOptions: {
    // secure: true should be used in production (HTTPS) but can be false for local dev
    secure: process.env.NODE_ENV === 'production',
  },
}

// A wrapper around getIronSession that enforces the instanceId check.
// If the session's instanceId doesn't match the current SERVER_INSTANCE_ID,
// it treats the session as invalid (clears it) and returns defaultSession.
export async function getAppSession(
  req?: Request | null,
  res?: Response | null
) {
  let session;
  if (req && res) {
    session = await getIronSession<SessionData>(req, res, sessionOptions)
  } else {
    session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  }

  // Only enforce instanceId check in Node.js runtime to avoid Edge/Node mismatch
  if (typeof process !== 'undefined' && process.release?.name === 'node') {
    if (session.isLoggedIn && session.instanceId !== getServerInstanceId()) {
      session.isLoggedIn = false
      session.userId = undefined
      session.username = undefined
      session.role = undefined
      session.instanceId = undefined
      // Do not call session.save() here if we don't have req/res, because Server Components throw errors when setting cookies
      if (req && res) {
        await session.save()
      }
    }
  }

  return session
}

