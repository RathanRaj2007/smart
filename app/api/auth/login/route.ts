import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'
import { getAppSession, getServerInstanceId } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit-log'

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('Missing DATABASE_URL environment variable')
      return NextResponse.json({ error: 'Server misconfiguration: DATABASE_URL is not set' }, { status: 500 })
    }

    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user) {
      // Audit log failed login attempt
      createAuditLog({
        username,
        action: 'AUTH_LOGIN_FAILURE',
        status: 'FAILURE',
        metadata: { reason: 'User not found' },
      })

      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      // Audit log failed login attempt
      createAuditLog({
        userId: user.id,
        username: user.username,
        action: 'AUTH_LOGIN_FAILURE',
        status: 'FAILURE',
        metadata: { reason: 'Incorrect password' },
      })

      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    const redirectUrl = user.role === 'ADMIN' ? '/admin' : '/dashboard'
    const response = NextResponse.json({ success: true, redirect: redirectUrl })
    const session = await getAppSession(request, response)

    session.userId = user.id
    session.username = user.username
    session.role = user.role
    session.instanceId = getServerInstanceId()
    session.isLoggedIn = true
    await session.save()

    // Audit log successful login
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
