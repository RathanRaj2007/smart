import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { generateLLMResponse, handleLLMError, FallbackRequiredError } from "@/lib/llm";
import { ANSWER_EVALUATOR_PROMPT, QUESTION_GENERATOR_PROMPT } from "@/lib/llm/prompts";
import { determineNextQuestionParams, updateSessionState } from "@/lib/interview/engine";
import { searchChunks } from "@/lib/knowledge-base/searchChunks";

export async function POST(req: NextRequest) {
  try {
    const res = NextResponse.json({});
    const { getAppSession } = await import("@/lib/auth");
    const userSession = await getAppSession(req as unknown as Request, res as unknown as Response);
    if (!userSession?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sessionId, questionId, transcript, forceProvider } = await req.json();

    if (!sessionId || !questionId || !transcript) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch Question
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { session: true }
    });

    if (!question || question.session.interviewerId !== userSession.userId) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // 2. Check if answer already exists
    let answer = await prisma.answer.findUnique({
      where: { questionId: question.id }
    });

    let providerUsed = "";
    let evalJson: Record<string, unknown> | null = null;

    if (answer) {
      const existingEval = await prisma.answerEvaluation.findUnique({ where: { answerId: answer.id } });
      const nextQuestion = await prisma.question.findFirst({
        where: { sessionId: sessionId, questionNumber: question.questionNumber + 1 }
      });
      
      // If we have an existing eval, we return it. If nextQuestion is already picked, we return that too.
      // If nextQuestion is NOT picked, we will still generate suggestions below (or could cache them).
      if (existingEval && nextQuestion) {
        return NextResponse.json({
          success: true,
          alreadyProcessed: true,
          evaluation: existingEval,
          nextQuestion: {
            id: nextQuestion.id,
            content: nextQuestion.content,
            questionNumber: nextQuestion.questionNumber
          }
        });
      }
      
      if (existingEval) {
        // Evaluate already done, just skip to generating suggestions!
        evalJson = existingEval; // (Re-use existing eval for generating suggestions if we wanted, but we already have it in DB)
      }
    }

    if (!answer) {
      // Save New Answer if it doesn't exist at all
      try {
        answer = await prisma.answer.create({
          data: {
            questionId: question.id,
            transcript: transcript,
          }
        });
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') { // Unique constraint failed
          answer = await prisma.answer.findUnique({ where: { questionId: question.id } });
          if (!answer) throw err;
        } else {
          throw err;
        }
      }
    }

    if (!answer || !await prisma.answerEvaluation.findUnique({ where: { answerId: answer.id } })) {
      // 3. RAG Retrieval for Evaluation Context
      const searchResults = await searchChunks(question.content + " " + transcript, 5);
      const contextText = searchResults.map(r => r.content).join("\n\n");

      // 4. Parallel AI Analysis - Evaluate Answer
      const evaluatorPrompt = ANSWER_EVALUATOR_PROMPT
        .replace("{{question}}", question.content)
        .replace("{{expected_answer}}", question.expectedAnswer || "")
        .replace("{{required_keywords}}", question.requiredKeywords.join(", "))
        .replace("{{candidate_answer}}", transcript)
        .replace("{{context}}", contextText);

      const { text: evaluationResponse, provider: _evalP } = await generateLLMResponse(evaluatorPrompt + "\n\nReply in strict JSON format.", forceProvider);
      providerUsed = providerUsed || _evalP;
      
      try {
        evalJson = JSON.parse(evaluationResponse);
      } catch {
        let cleaned = evaluationResponse.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
        cleaned = cleaned.replace(/,\s*([\}\]])/g, "$1"); // fix trailing commas
        try {
          evalJson = JSON.parse(cleaned);
        } catch {
          console.error("Failed to parse eval JSON:", cleaned);
          evalJson = { score: 70, correctness: "Could not parse AI evaluation.", completeness: "", relevance: "", technical_accuracy: "", feedback: "LLM returned malformed JSON." };
        }
      }

      // 5. Save Evaluation
      await prisma.answerEvaluation.upsert({
        where: { answerId: answer.id },
        update: {
          score: Number(evalJson?.score) || 70,
          correctness: String(evalJson?.correctness) || "",
          completeness: String(evalJson?.completeness) || "",
          relevance: String(evalJson?.relevance) || "",
          technicalAccuracy: String(evalJson?.technical_accuracy) || "",
          mentionedKeywords: (evalJson?.mentioned_keywords as string[]) || [],
          missingKeywords: (evalJson?.missing_keywords as string[]) || [],
          feedback: String(evalJson?.feedback) || ""
        },
        create: {
          answerId: answer.id,
          score: Number(evalJson?.score) || 70,
          correctness: String(evalJson?.correctness) || "",
          completeness: String(evalJson?.completeness) || "",
          relevance: String(evalJson?.relevance) || "",
          technicalAccuracy: String(evalJson?.technical_accuracy) || "",
          mentionedKeywords: (evalJson?.mentioned_keywords as string[]) || [],
          missingKeywords: (evalJson?.missing_keywords as string[]) || [],
          feedback: String(evalJson?.feedback) || ""
        }
      });

      // Save Knowledge Gaps
      if ((evalJson?.knowledge_gap as Array<{concept: string, confidence: string, evidence: string}>) && Array.isArray((evalJson?.knowledge_gap as Array<{concept: string, confidence: string, evidence: string}>))) {
        for (const gap of (evalJson?.knowledge_gap as Array<{concept: string, confidence: string, evidence: string}>)) {
          await prisma.knowledgeGap.create({
            data: {
              sessionId: sessionId,
              concept: gap.concept,
              confidence: gap.confidence,
              evidence: gap.evidence
            }
          });
        }
      }

      // Update session score
      await updateSessionState(sessionId);

      const { createAuditLog } = await import("@/lib/audit-log");
      createAuditLog({
        userId: userSession.userId,
        username: userSession.username,
        action: "INTERVIEW_EVALUATED",
        entityType: "Question",
        entityId: questionId,
        metadata: { score: Number(evalJson?.score) || 70, sessionId }
      });
    }

    // 6. Adaptive Question Engine - Decide Next Question SUGGESTIONS
    const nextParams = await determineNextQuestionParams(sessionId);
    
    // Fetch session scope to respect material or keywords
    const sessionObj = await prisma.interviewSession.findUnique({ where: { id: sessionId } });
    const scope = sessionObj?.scope as Record<string, unknown> || {};
    const mode = scope.mode || "standard";
    const setupData = scope.setupData || "";

    let contextTextNext = "";
    if (mode === "material") {
      contextTextNext = "RESTRICT ALL QUESTIONS TO THIS MATERIAL:\n" + setupData;
    } else if (mode === "keywords") {
      const searchResultsNext = await searchChunks(`[${scope.subject}] ${setupData} ${question.content}`, 3);
      contextTextNext = "FOCUS STRICTLY ON THESE KEYWORDS: " + setupData + "\n\n" + searchResultsNext.map(r => r.content).join("\n\n");
    } else {
      const searchResultsNext = await searchChunks(question.content, 3);
      contextTextNext = searchResultsNext.map(r => r.content).join("\n\n");
    }
    
    const generatorPrompt = QUESTION_GENERATOR_PROMPT
      .replace("{{subject}}", (scope.subject as string) || "Configured Subject") 
      .replace("{{topic}}", "Adaptive Topic")
      .replace("{{difficulty}}", nextParams.difficulty)
      .replace("{{context}}", contextTextNext) 
      .replace("{{previous_questions}}", nextParams.previousQuestions.join("\n"))
      .replace("{{weak_concepts}}", nextParams.weakConcepts.join(", "))
      .replace("{{remaining_concepts}}", ""); 

    const { text: nextQResponse, provider: nextProvider } = await generateLLMResponse(generatorPrompt + "\n\nReply in strict JSON format.", forceProvider);
    providerUsed = nextProvider || providerUsed;
    let nextQJson;
    try {
      nextQJson = JSON.parse(nextQResponse);
    } catch {
      let cleaned = nextQResponse.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
      cleaned = cleaned.replace(/,\s*([\}\]])/g, "$1");
      try {
        nextQJson = JSON.parse(cleaned);
      } catch {
        console.error("Failed to parse nextQ JSON:", cleaned);
        nextQJson = { suggestions: [{ question: "Can you elaborate on your previous answer?", type: "Conceptual", difficulty: "medium", topic: "General", reason: "Fallback" }] };
      }
    }

    return NextResponse.json({
      provider: providerUsed, evaluation: evalJson || await prisma.answerEvaluation.findUnique({ where: { answerId: answer.id } }),
      suggestedQuestions: nextQJson.suggestions || []
    });
    
  } catch (error: unknown) {
    console.error("Evaluation pipeline error:", error);
    if (error instanceof FallbackRequiredError) {
      return handleLLMError(error);
    }
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}








