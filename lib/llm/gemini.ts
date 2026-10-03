/**
 * Gemini LLM helper — SERVER SIDE ONLY
 *
 * Uses @google/generative-ai (official Google GenAI JS SDK).
 * GEMINI_API_KEY is read exclusively from process.env (server-side).
 * The key is never exposed to the browser or logged.
 */
import { GoogleGenerativeAI } from '@google/generative-ai'

// Lazily-initialized client and model cached across requests
declare const globalThis: {
  _geminiAI?: GoogleGenerativeAI | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _geminiModel?: any
} & typeof global

let _genAI: GoogleGenerativeAI | null = globalThis._geminiAI ?? null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _geminiModel: any = globalThis._geminiModel ?? null

export function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error(
        '[gemini] GEMINI_API_KEY is not set in environment variables. ' +
          'Add it to .env.local on the server. Never use NEXT_PUBLIC_GEMINI_API_KEY.'
      )
    }
    _genAI = new GoogleGenerativeAI(apiKey)
    if (process.env.NODE_ENV !== 'production') {
      globalThis._geminiAI = _genAI
    }
  }
  return _genAI
}

/**
 * The Gemini model to use.
 */
export const GEMINI_MODEL = 'gemini-3.6-flash' // Restored to 3.6-flash

export function getGeminiModel() {
  if (!_geminiModel) {
    const genAI = getGenAI()
    _geminiModel = genAI.getGenerativeModel({ model: GEMINI_MODEL })
    if (process.env.NODE_ENV !== 'production') {
      globalThis._geminiModel = _geminiModel
    }
  }
  return _geminiModel
}

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

  const model = getGeminiModel()

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }, { signal: controller.signal })
    const response = result.response
    const text = response.text()

    if (!text) {
      throw new Error('[gemini] Empty response received from Gemini API')
    }

    return text
  } catch (err: unknown) {
    if ((err as Error).name === 'AbortError' || (err as Error).message.includes('aborted')) {
      throw new Error('[gemini] Request timed out after 60 seconds');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
