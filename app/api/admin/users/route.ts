import { NextResponse } from 'next/server'
import { getAppSession } from '@/lib/auth'
import prisma from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const response = NextResponse.json({})
    const session = await getAppSession(request, response)

    if (!session?.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || 'ALL'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)))

    const where: Prisma.UserWhereInput = {}

    if (search.trim()) {
      where.username = { contains: search.trim(), mode: 'insensitive' }
    }

    if (role && role !== 'ALL') {
      where.role = role
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              sessions: true,
              documents: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return NextResponse.json({
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    })
  } catch (err) {
    console.error('Fetch admin users error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
