import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { generateLLMResponse } from "@/lib/llm";
import { QUESTION_GENERATOR_PROMPT } from "@/lib/llm/prompts";
import { searchChunks } from "@/lib/knowledge-base/searchChunks";
import { createAuditLog } from "@/lib/audit-log";

export async function POST(req: NextRequest) {
  try {
    const { candidateName, subject, mode, setupData, forceProvider } = await req.json();

    if (!candidateName || !subject) {
      return NextResponse.json({ error: "Missing candidate name or subject" }, { status: 400 });
    }

    // Get Session to get real userId if available
    const res = NextResponse.json({});
    let userId = null;
    let username = null;
    try {
      const { getAppSession } = await import("@/lib/auth");
      // Use unknown as any to bypass NextRequest typing issues with getIronSession if any
      const ironSession = await getAppSession(req as unknown as Request, res as unknown as Response);
      if (ironSession?.userId) {
        userId = ironSession.userId;
        username = ironSession.username;
      }
    } catch {
      console.error("Session fetch failed");
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create Candidate
    const candidate = await prisma.candidate.create({
      data: { name: candidateName }
    });

    // Create Session
    const session = await prisma.interviewSession.create({
      data: {
        candidateId: candidate.id,
        interviewerId: userId,
        status: "active",
        difficulty: "medium",
        interviewType: "Adaptive",
        scope: { subject: subject, mode: mode || "standard", setupData: setupData || "" }
      }
    });

    // Audit log interview created
    createAuditLog({
      userId,
      username,
      action: 'INTERVIEW_CREATED',
      entityType: 'InterviewSession',
      entityId: session.id,
      metadata: { candidateName, subject, mode: mode || 'standard' }
    });

    let contextText = "";
    let topicToStart = "Fundamentals";

    if (mode === "material" && setupData) {
      // Bypass RAG, just use the provided material directly
      contextText = "RESTRICT ALL QUESTIONS TO THIS MATERIAL:\n" + setupData;
      topicToStart = "Material Based";
    } else if (mode === "keywords" && setupData) {
      // Focus on these keywords
      const searchResults = await searchChunks(`[${subject}] ${setupData}`, userId);
      contextText = "FOCUS STRICTLY ON THESE KEYWORDS: " + setupData + "\n\n" + searchResults.map(r => r.content).join("\n\n");
      topicToStart = "Keyword Focused";
    } else if (mode === "knowledge-base") {
      // Focus strictly on the uploaded knowledge base docx/files
      // Use a broad query, but request more chunks to ensure we cover the KB
      let docIds: number[] | undefined;
      try {
        if (setupData) {
          docIds = JSON.parse(setupData);
        }
      } catch {
        // ignore parse error
      }
      const searchResults = await searchChunks(`[${subject}]`, userId, 20, docIds);
      contextText = "RESTRICT ALL QUESTIONS STRICTLY TO THE FOLLOWING KNOWLEDGE BASE MATERIAL ONLY. DO NOT ASK ANYTHING OUTSIDE THIS MATERIAL:\n\n" + searchResults.map(r => r.content).join("\n\n");
      topicToStart = "Knowledge Base Based";
    } else {
      // Standard RAG
      const searchResults = await searchChunks(`[${subject}] basics introduction definition core concepts`, userId);
      contextText = searchResults.map(r => r.content).join("\n\n");
    }

    const generatorPrompt = QUESTION_GENERATOR_PROMPT
      .replace("{{subject}}", subject)
      .replace("{{topic}}", topicToStart)
      .replace("{{difficulty}}", "easy")
      .replace("{{context}}", contextText)
      .replace("{{previous_questions}}", "None")
      .replace("{{weak_concepts}}", "None")
      .replace("{{remaining_concepts}}", "All");

    const { text: nextQResponse, provider } = await generateLLMResponse(generatorPrompt + "\n\nReply in strict JSON format.", forceProvider);
    
    let nextQJson;
    try {
      nextQJson = JSON.parse(nextQResponse);
    } catch {
      const cleaned = nextQResponse.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
      try {
        nextQJson = JSON.parse(cleaned);
      } catch {
        nextQJson = { suggestions: [{ question: "What is an algorithm?", type: "Conceptual", difficulty: "easy", topic: "Basics" }] };
      }
    }

    const suggestion = nextQJson.suggestions?.[0] || nextQJson;

    const firstQuestion = await prisma.question.create({
      data: {
        sessionId: session.id,
        questionNumber: 1,
        content: suggestion.question || "What is an algorithm?",
        type: suggestion.type || "Conceptual",
        difficulty: suggestion.difficulty || "easy",
        topic: suggestion.topic || "Fundamentals",
        expectedAnswer: suggestion.expected_answer || "",
        coreConcepts: suggestion.concepts || [],
        requiredKeywords: suggestion.required_keywords || []
      }
    });

    return NextResponse.json({
      sessionId: session.id,
      candidate: candidate,
      provider, firstQuestion: {
        id: firstQuestion.id,
        content: firstQuestion.content,
        questionNumber: firstQuestion.questionNumber
      }
    });
    
  } catch (error: unknown) {
    const { handleLLMError } = await import('@/lib/llm');
    return handleLLMError(error);
  }
}
