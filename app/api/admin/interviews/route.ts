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
    const status = searchParams.get('status') || 'ALL'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)))

    const where: Prisma.InterviewSessionWhereInput = {}

    if (status && status !== 'ALL') {
      where.status = status
    }

    if (search.trim()) {
      const q = search.trim()
      where.OR = [
        { interviewType: { contains: q, mode: 'insensitive' } },
        { candidate: { name: { contains: q, mode: 'insensitive' } } },
        { candidate: { email: { contains: q, mode: 'insensitive' } } },
        { interviewer: { username: { contains: q, mode: 'insensitive' } } },
      ]
    }

    const [total, interviews] = await Promise.all([
      prisma.interviewSession.count({ where }),
      prisma.interviewSession.findMany({
        where,
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          interviewer: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
          report: {
            select: {
              id: true,
              overallScore: true,
            },
          },
          _count: {
            select: {
              questions: true,
            },
          },
        },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return NextResponse.json({
      interviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    })
  } catch (err) {
    console.error('Fetch admin interviews error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
