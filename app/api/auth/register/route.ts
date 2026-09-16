import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    // Check if username already exists
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: 'Username already exists.' }, { status: 409 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    await prisma.user.create({ data: { username, passwordHash, role: 'INTERVIEWER' } })

    return NextResponse.json({ success: true, redirect: '/login' }, { status: 201 })
  } catch (err) {
    console.error('Registration error:', err)
    // Do not leak DB errors to clients
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
