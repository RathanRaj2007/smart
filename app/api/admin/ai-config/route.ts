import { NextResponse } from 'next/server'
import { getAppSession } from '@/lib/auth'
import { GEMINI_MODEL } from '@/lib/llm/gemini'
import { GROQ_MODEL } from '@/lib/llm/groq'

// GET /api/admin/ai-config — return LLM configuration status (admin only)
export async function GET(request: Request) {
  try {
    const response = NextResponse.json({})
    const session = await getAppSession(request, response)

    if (!session?.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden — Admin only' }, { status: 403 })
    }

    const geminiKeyConfigured = !!process.env.GEMINI_API_KEY
    const groqKeyConfigured = !!process.env.GROQ_API_KEY

    const providers = [
      {
        id: 'gemini',
        name: 'Google Gemini',
        model: GEMINI_MODEL,
        configured: geminiKeyConfigured,
        keyStatus: geminiKeyConfigured ? 'Configured (server-side)' : 'Not configured — set GEMINI_API_KEY in .env.local',
      },
      {
        id: 'groq',
        name: 'Groq',
        model: GROQ_MODEL,
        configured: groqKeyConfigured,
        keyStatus: groqKeyConfigured ? 'Configured (server-side)' : 'Not configured — set GROQ_API_KEY in .env.local',
      },
    ]

    return NextResponse.json({
      providers,
      ragEnabled: true,
      embeddingModel: 'all-MiniLM-L6-v2 (local, 384-dim)',
      vectorStore: 'pgvector (PostgreSQL)',
      chunkSize: 1200,
      chunkOverlap: 200,
      topK: 5,
    })
  } catch (err) {
    console.error('Admin AI config GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
