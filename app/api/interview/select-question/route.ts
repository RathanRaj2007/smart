import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAppSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const res = NextResponse.json({});
    const userSession = await getAppSession(req, res);
    if (!userSession?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sessionId, questionNumber, suggestion } = await req.json();

    if (!sessionId || !questionNumber || !suggestion) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure session exists
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { candidate: true }
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const isOwner =
      userSession.role === 'ADMIN' ||
      session.interviewerId === userSession.userId ||
      (session.candidate?.userId !== null && session.candidate?.userId === userSession.userId);

    if (!isOwner) {
      return NextResponse.json({ error: "Session not found or unauthorized" }, { status: 404 });
    }

    // Ensure this question number doesn't already exist to prevent duplicates
    const existingQuestion = await prisma.question.findFirst({
      where: { sessionId, questionNumber }
    });

    if (existingQuestion) {
      return NextResponse.json(
        { message: "Question already generated", question: existingQuestion },
        { status: 200 }
      );
    }

    // Save Next Question
    const nextQuestion = await prisma.question.create({
      data: {
        sessionId: sessionId,
        questionNumber: questionNumber,
        content: suggestion.question,
        type: suggestion.type || "Conceptual",
        difficulty: suggestion.difficulty || "medium",
        topic: suggestion.topic || "General",
        expectedAnswer: suggestion.expected_answer || "",
        coreConcepts: suggestion.concepts || [],
        requiredKeywords: suggestion.required_keywords || []
      }
    });

    return NextResponse.json({ question: nextQuestion });
  } catch (error: unknown) {
    console.error("Select question error:", error);
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

