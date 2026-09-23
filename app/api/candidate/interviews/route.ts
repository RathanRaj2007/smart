import { NextResponse } from 'next/server'
import { getAppSession } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(request: Request) {
  try {
    const response = NextResponse.json({})
    const session = await getAppSession(request, response)

    if (!session?.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    if (session.role !== 'CANDIDATE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '10', 10)))

    // Strictly scope candidate identity from authenticated session.userId
    const candidate = await prisma.candidate.findUnique({
      where: { userId: session.userId },
      select: { id: true }
    })

    if (!candidate) {
      return NextResponse.json({
        interviews: [],
        total: 0,
        page,
        limit,
        totalPages: 1
      })
    }

    const where = { candidateId: candidate.id }

    const [total, interviews] = await Promise.all([
      prisma.interviewSession.count({ where }),
      prisma.interviewSession.findMany({
        where,
        select: {
          id: true,
          interviewType: true,
          difficulty: true,
          status: true,
          score: true,
          startedAt: true,
          endedAt: true,
          scope: true,
          interviewer: {
            select: {
              username: true
            }
          },
          report: {
            select: {
              id: true,
              overallScore: true
            }
          }
        },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })
    ])

    return NextResponse.json({
      interviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    })
  } catch (err) {
    console.error('Candidate interviews API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
