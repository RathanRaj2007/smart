-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "branch" TEXT,
ADD COLUMN     "institution" TEXT,
ADD COLUMN     "semester" TEXT,
ADD COLUMN     "subject" TEXT;

-- AlterTable
ALTER TABLE "DocumentChunk" ADD COLUMN     "pageNumber" INTEGER,
ADD COLUMN     "sourceType" TEXT,
ADD COLUMN     "topic" TEXT,
ADD COLUMN     "unit" TEXT;

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewSession" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "interviewerId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "interviewType" TEXT NOT NULL,
    "scope" JSONB,
    "score" DOUBLE PRECISION,
    "topicsCovered" TEXT[],
    "weakTopics" TEXT[],
    "strongTopics" TEXT[],
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "InterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionNumber" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "topic" TEXT,
    "expectedAnswer" TEXT,
    "coreConcepts" TEXT[],
    "requiredKeywords" TEXT[],
    "askedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "audioPath" TEXT,
    "duration" INTEGER,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerEvaluation" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "correctness" TEXT NOT NULL,
    "completeness" TEXT NOT NULL,
    "relevance" TEXT NOT NULL,
    "technicalAccuracy" TEXT NOT NULL,
    "mentionedKeywords" TEXT[],
    "missingKeywords" TEXT[],
    "feedback" TEXT NOT NULL,

    CONSTRAINT "AnswerEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeGap" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,

    CONSTRAINT "KnowledgeGap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewReport" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "topicScores" JSONB NOT NULL,
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "executiveSummary" TEXT NOT NULL,
    "improvementPlan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Answer_questionId_key" ON "Answer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerEvaluation_answerId_key" ON "AnswerEvaluation"("answerId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewReport_sessionId_key" ON "InterviewReport"("sessionId");

-- CreateIndex
CREATE INDEX "Document_subject_idx" ON "Document"("subject");

-- CreateIndex
CREATE INDEX "DocumentChunk_topic_idx" ON "DocumentChunk"("topic");

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerEvaluation" ADD CONSTRAINT "AnswerEvaluation_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeGap" ADD CONSTRAINT "KnowledgeGap_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewReport" ADD CONSTRAINT "InterviewReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
