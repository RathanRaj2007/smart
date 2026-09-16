import prisma from "../db";

export async function determineNextQuestionParams(sessionId: string) {
  // Fetch session with questions and evaluations
  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    include: {
      questions: {
        include: { answer: { include: { evaluation: true } } },
        orderBy: { askedAt: "asc" }
      },
      gaps: true,
    }
  });

  if (!session) throw new Error("Session not found");

  const totalQuestions = session.questions.length;
  const lastQuestion = session.questions[totalQuestions - 1];
  let currentDifficulty = session.difficulty;

  if (lastQuestion?.answer?.evaluation) {
    const lastScore = lastQuestion.answer.evaluation.score;
    // Basic Adaptive Difficulty Logic
    if (lastScore >= 80 && currentDifficulty !== "expert") {
      if (currentDifficulty === "easy") currentDifficulty = "medium";
      else if (currentDifficulty === "medium") currentDifficulty = "hard";
      else if (currentDifficulty === "hard") currentDifficulty = "expert";
    } else if (lastScore <= 40 && currentDifficulty !== "easy") {
      if (currentDifficulty === "expert") currentDifficulty = "hard";
      else if (currentDifficulty === "hard") currentDifficulty = "medium";
      else if (currentDifficulty === "medium") currentDifficulty = "easy";
    }
  }

  // Update session difficulty
  await prisma.interviewSession.update({
    where: { id: sessionId },
    data: { difficulty: currentDifficulty }
  });

  return {
    difficulty: currentDifficulty,
    previousQuestions: session.questions.map(q => q.content),
    weakConcepts: session.gaps.map(g => g.concept),
    // Additional state can be retrieved here (topics, scope)
  };
}

export async function updateSessionState(sessionId: string) {
  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    include: {
      questions: {
        include: { answer: { include: { evaluation: true } } }
      }
    }
  });

  if (!session) return;

  const evals = session.questions.map(q => q.answer?.evaluation).filter(Boolean);
  if (evals.length === 0) return;

  const totalScore = evals.reduce((sum, ev) => sum + (ev?.score || 0), 0) / evals.length;

  await prisma.interviewSession.update({
    where: { id: sessionId },
    data: { score: totalScore }
  });
}
