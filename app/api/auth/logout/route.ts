import { NextResponse } from 'next/server'
import { getAppSession } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit-log'

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true, redirect: '/login' })
  const session = await getAppSession(request, response)

  if (session?.userId) {
    createAuditLog({
      userId: session.userId,
      username: session.username,
      action: 'AUTH_LOGOUT',
      status: 'SUCCESS',
    })
  }

  session.destroy()
  return response
}

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/login', request.url))
  const session = await getAppSession(request, response)

  if (session?.userId) {
    createAuditLog({
      userId: session.userId,
      username: session.username,
      action: 'AUTH_LOGOUT',
      status: 'SUCCESS',
    })
  }

  session.destroy()
  return response
}
