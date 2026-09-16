/**
 * Gemini LLM helper — SERVER SIDE ONLY
 *
 * Uses @google/generative-ai (official Google GenAI JS SDK).
 * GEMINI_API_KEY is read exclusively from process.env (server-side).
 * The key is never exposed to the browser or logged.
 */
import { GoogleGenerativeAI } from '@google/generative-ai'

// Lazily-initialized client
let _genAI: GoogleGenerativeAI | null = null

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error(
        '[gemini] GEMINI_API_KEY is not set in environment variables. ' +
          'Add it to .env.local on the server. Never use NEXT_PUBLIC_GEMINI_API_KEY.'
      )
    }
    _genAI = new GoogleGenerativeAI(apiKey)
  }
  return _genAI
}

/**
 * The Gemini model to use.
 */
export const GEMINI_MODEL = 'gemini-3.6-flash' // Restored to 3.6-flash

/**
 * Generate a text response from Gemini given a prompt string.
 *
 * @param prompt  Full prompt including any context/instructions
 * @returns       Generated text response
 */
export async function generateGeminiResponse(prompt: string): Promise<string> {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('[gemini] Prompt cannot be empty')
  }

  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  const result = await model.generateContent(prompt)
  const response = result.response
  const text = response.text()

  if (!text) {
    throw new Error('[gemini] Empty response received from Gemini API')
  }

  return text
}
