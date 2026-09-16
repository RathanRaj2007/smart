import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const res = NextResponse.json({});
    const { getAppSession } = await import("@/lib/auth");
    const userSession = await getAppSession(req as unknown as Request, res as unknown as Response);
    if (!userSession?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: "No session ID" }, { status: 400 });
    }

    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        candidate: true,
        questions: {
          include: { answer: { include: { evaluation: true } } },
          orderBy: { askedAt: "asc" }
        }
      }
    });

    if (!session || session.interviewerId !== userSession.userId || session.status !== 'active') {
      return NextResponse.json({ error: "Session not found or inactive" }, { status: 404 });
    }

    const currentQuestion = session.questions[session.questions.length - 1];

    const evaluations = session.questions
      .filter(q => q.answer?.evaluation)
      .map(q => ({
        question: q.content,
        answer: q.answer!.transcript,
        feedback: q.answer!.evaluation
      }));

    return NextResponse.json({
      sessionId: session.id,
      candidate: session.candidate,
      currentQuestion: {
        id: currentQuestion.id,
        content: currentQuestion.content,
        questionNumber: currentQuestion.questionNumber
      },
      evaluations
    });
  } catch (error: unknown) {
    console.error("Resume interview error:", error);
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

