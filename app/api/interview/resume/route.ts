import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAppSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const res = NextResponse.json({});
    const userSession = await getAppSession(req as unknown as Request, res as unknown as Response);
    if (!userSession?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    let session = null;

    if (sessionId) {
      // Find session by explicit sessionId and verify ownership
      session = await prisma.interviewSession.findUnique({
        where: { id: sessionId },
        include: {
          candidate: true,
          questions: {
            include: { answer: { include: { evaluation: true } } },
            orderBy: { askedAt: "asc" }
          }
        }
      });

      if (!session || session.status !== 'active') {
        return NextResponse.json({ error: "Session not found or inactive" }, { status: 404 });
      }

      const isOwner =
        userSession.role === 'ADMIN' ||
        session.interviewerId === userSession.userId ||
        (session.candidate?.userId !== null && session.candidate?.userId === userSession.userId);

      if (!isOwner) {
        return NextResponse.json({ error: "Unauthorized access to session" }, { status: 403 });
      }
    } else {
      // Auto-detect active session for authenticated user
      if (userSession.role === 'CANDIDATE') {
        session = await prisma.interviewSession.findFirst({
          where: {
            candidate: { userId: userSession.userId },
            status: 'active'
          },
          orderBy: { startedAt: 'desc' },
          include: {
            candidate: true,
            questions: {
              include: { answer: { include: { evaluation: true } } },
              orderBy: { askedAt: "asc" }
            }
          }
        });
      } else if (userSession.role === 'INTERVIEWER') {
        session = await prisma.interviewSession.findFirst({
          where: {
            interviewerId: userSession.userId,
            status: 'active'
          },
          orderBy: { startedAt: 'desc' },
          include: {
            candidate: true,
            questions: {
              include: { answer: { include: { evaluation: true } } },
              orderBy: { askedAt: "asc" }
            }
          }
        });
      }
    }

    if (!session || session.status !== 'active') {
      return NextResponse.json({ activeSession: false, userRole: userSession.role, message: "No active interview session" });
    }

    const currentQuestion = session.questions.length > 0
      ? session.questions[session.questions.length - 1]
      : null;

    const evaluations = session.questions
      .filter(q => q.answer?.evaluation)
      .map(q => ({
        question: q.content,
        answer: q.answer!.transcript,
        feedback: q.answer!.evaluation
      }));

    return NextResponse.json({
      activeSession: true,
      sessionId: session.id,
      userRole: userSession.role,
      session: {
        id: session.id,
        candidateId: session.candidateId,
        status: session.status,
        difficulty: session.difficulty,
        interviewType: session.interviewType,
        scope: session.scope,
        startedAt: session.startedAt,
      },
      candidate: session.candidate,
      currentQuestion: currentQuestion ? {
        id: currentQuestion.id,
        content: currentQuestion.content,
        questionNumber: currentQuestion.questionNumber,
        type: currentQuestion.type,
        difficulty: currentQuestion.difficulty,
        topic: currentQuestion.topic,
      } : null,
      questions: session.questions.map(q => ({
        id: q.id,
        questionNumber: q.questionNumber,
        content: q.content,
        type: q.type,
        difficulty: q.difficulty,
        topic: q.topic,
        hasAnswer: !!q.answer
      })),
      evaluations
    });
  } catch (error: unknown) {
    console.error("Resume interview error:", error);
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
