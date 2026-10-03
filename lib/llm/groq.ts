import Groq from 'groq-sdk'

// Lazily-initialized client cached across requests
declare const globalThis: {
  _groqClient?: Groq | null
} & typeof global

let _groq: Groq | null = globalThis._groqClient ?? null

export function getGroq(): Groq {
  if (!_groq) {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      throw new Error(
        '[groq] GROQ_API_KEY is not set in environment variables. ' +
          'Add it to .env.local on the server. Never use NEXT_PUBLIC_GROQ_API_KEY.'
      )
    }
    _groq = new Groq({ apiKey })
    if (process.env.NODE_ENV !== 'production') {
      globalThis._groqClient = _groq
    }
  }
  return _groq
}

export const GROQ_MODEL = 'openai/gpt-oss-20b' // Restored to supported model

export async function generateGroqResponse(prompt: string): Promise<string> {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('[groq] Prompt cannot be empty')
  }

  const groq = getGroq()

  // Only use json_object if the prompt explicitly asks for JSON
  const isJsonRequest = prompt.toLowerCase().includes('json');

  // Add 60s timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: GROQ_MODEL,
      ...(isJsonRequest ? { response_format: { type: "json_object" } } : {})
    }, { signal: controller.signal as AbortSignal });

    const content = completion.choices[0]?.message?.content || ''
      
    // Remove reasoning tags if the model includes them
    const cleanedContent = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
      
    if (!cleanedContent) {
      throw new Error('[groq] Empty response received from Groq API')
    }

    return cleanedContent;
  } catch (err: unknown) {
    if ((err as Error).name === 'AbortError' || (err as Error).message.includes('aborted')) {
      throw new Error('[groq] Request timed out after 60 seconds');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
