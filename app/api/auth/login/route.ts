import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'
import { getAppSession, getServerInstanceId } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit-log'
import { generateSecureOtp, hashOtp } from '@/lib/otp'
import { sendOtpEmail } from '@/lib/mail'

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('Missing DATABASE_URL environment variable')
      return NextResponse.json({ error: 'Server misconfiguration: DATABASE_URL is not set' }, { status: 500 })
    }

    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username/email and password are required' },
        { status: 400 }
      )
    }

    const normalizedInput = username.trim().toLowerCase()

    // --- ADMIN FLOW: unchanged ---
    // Try to find an exact username match first (admin uses username, not email)
    const userByUsername = await prisma.user.findUnique({
      where: { username: username.trim() },
    })

    if (userByUsername && userByUsername.role === 'ADMIN') {
      // Admin: validate password and create session immediately
      if (!userByUsername.passwordHash) {
        return NextResponse.json(
          { error: 'Password login is not enabled for this account.' },
          { status: 403 }
        )
      }

      const isPasswordValid = await bcrypt.compare(password, userByUsername.passwordHash)
      if (!isPasswordValid) {
        createAuditLog({
          userId: userByUsername.id,
          username: userByUsername.username,
          action: 'AUTH_LOGIN_FAILURE',
          status: 'FAILURE',
          metadata: { reason: 'Incorrect password', role: 'ADMIN' },
        })
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        )
      }

      const response = NextResponse.json({ success: true, redirect: '/admin' })
      const session = await getAppSession(request, response)
      session.userId = userByUsername.id
      session.username = userByUsername.username
      session.role = userByUsername.role
      session.instanceId = getServerInstanceId()
      session.isLoggedIn = true
      await session.save()

      createAuditLog({
        userId: userByUsername.id,
        username: userByUsername.username,
        action: 'ADMIN_LOGIN_SUCCESS',
        status: 'SUCCESS',
        metadata: { role: 'ADMIN' },
      })
      return response
    }

    // --- CANDIDATE / INTERVIEWER FLOW: password verify → send OTP (no session yet) ---
    // Look up by username OR email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.trim() },
          { email: normalizedInput },
          { username: normalizedInput },
          { candidate: { email: normalizedInput } },
        ],
        role: { in: ['CANDIDATE', 'INTERVIEWER'] },
      },
    })

    if (!user) {
      createAuditLog({
        username: username.trim(),
        action: 'AUTH_LOGIN_FAILURE',
        status: 'FAILURE',
        metadata: { reason: 'User not found', input: normalizedInput },
      })
      return NextResponse.json(
        { error: 'Invalid username/email or password' },
        { status: 401 }
      )
    }

    // Account exists but has no password set (previously passwordless)
    if (!user.passwordHash) {
      return NextResponse.json(
        {
          requiresPasswordSetup: true,
          email: user.email || user.username,
          role: user.role,
          message: 'Your account requires a password to be set before signing in.',
        },
        { status: 403 }
      )
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      createAuditLog({
        userId: user.id,
        username: user.username,
        action: 'AUTH_LOGIN_FAILURE',
        status: 'FAILURE',
        metadata: { reason: 'Incorrect password', role: user.role },
      })
      return NextResponse.json(
        { error: 'Invalid username/email or password' },
        { status: 401 }
      )
    }

    // Password correct — generate session directly (OTP REMOVED)
    const redirectUrl = user.role === 'CANDIDATE' ? '/candidate' : '/dashboard'
    const response = NextResponse.json({ success: true, redirect: redirectUrl })
    const session = await getAppSession(request, response)
    session.userId = user.id
    session.username = user.username
    session.role = user.role
    session.instanceId = getServerInstanceId()
    session.isLoggedIn = true
    await session.save()

    createAuditLog({
      userId: user.id,
      username: user.username,
      action: 'AUTH_LOGIN_SUCCESS',
      status: 'SUCCESS',
      metadata: { role: user.role },
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
