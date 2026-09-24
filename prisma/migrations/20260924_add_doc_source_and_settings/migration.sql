-- Add document source tracking fields for Admin Master KB / Interviewer Private KB / Synced Docs
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "docSource" TEXT NOT NULL DEFAULT 'INTERVIEWER_PRIVATE';
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "adminDocId" INTEGER;

-- Create indexes
CREATE INDEX IF NOT EXISTS "Document_docSource_idx" ON "Document"("docSource");
CREATE INDEX IF NOT EXISTS "Document_adminDocId_idx" ON "Document"("adminDocId");

-- Create AppSettings table for persisting admin configuration
CREATE TABLE IF NOT EXISTS "AppSettings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- Create unique index on key
CREATE UNIQUE INDEX IF NOT EXISTS "AppSettings_key_key" ON "AppSettings"("key");
CREATE INDEX IF NOT EXISTS "AppSettings_key_idx" ON "AppSettings"("key");
