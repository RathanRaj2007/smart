import { generateGeminiResponse } from './gemini';
import { generateGroqResponse } from './groq';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export class FallbackRequiredError extends Error {
  public failedProvider: string;
  public fallbackProvider: string;

  constructor(failedProvider: string, fallbackProvider: string, message: string) {
    super(message);
    this.name = 'FallbackRequiredError';
    this.failedProvider = failedProvider;
    this.fallbackProvider = fallbackProvider;
  }
}

export async function generateLLMResponse(prompt: string, forceProvider?: string): Promise<{ text: string; provider: string }> {
  const cookieStore = await cookies();
  const storedLLM = cookieStore.get('selectedLLM')?.value;
  
  let resolvedProvider: string | null = null;

  if (forceProvider && (forceProvider === 'gemini' || forceProvider === 'groq')) {
    resolvedProvider = forceProvider;
  } else if (storedLLM === 'gemini' || storedLLM === 'groq') {
    resolvedProvider = storedLLM;
  }

  if (!resolvedProvider) {
    throw new Error('Configuration Error: No LLM provider selected. Please select a provider in Settings.');
  }

  console.log(`[LLM] Selected provider: ${resolvedProvider}`);
  console.log(`[LLM] Request started`);

  let lastErrorMsg = 'Unknown error';
  let isKeyError = false;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      if (resolvedProvider === 'groq') {
        console.log(`[LLM] Groq request started (Attempt ${attempt}/3)`);
        const text = await generateGroqResponse(prompt);
        console.log(`[LLM] Groq request successful`);
        return { text, provider: 'groq' };
      } else {
        console.log(`[LLM] Gemini request started (Attempt ${attempt}/3)`);
        const text = await generateGeminiResponse(prompt);
        console.log(`[LLM] Gemini request successful`);
        return { text, provider: 'gemini' };
      }
    } catch (err: unknown) {
      lastErrorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[LLM] ${resolvedProvider} request failed on attempt ${attempt}:`, lastErrorMsg);
      
      // If there's an API key configuration issue, do not retry
      if (lastErrorMsg.toLowerCase().includes('api key not valid') || lastErrorMsg.toLowerCase().includes('invalid api key')) {
        isKeyError = true;
        break; // break retry loop
      }
      
      if (attempt < 3) {
        // Wait before retrying (exponential backoff: 1s, 2s)
        await new Promise(r => setTimeout(r, attempt * 1000));
      }
    }
  }

  // If we broke out early because of a key error
  if (isKeyError) {
    throw new Error(`Configuration Error: Invalid ${resolvedProvider} API Key`);
  }

  // Exhausted all 3 attempts
  const fallbackProvider = resolvedProvider === 'groq' ? 'gemini' : 'groq';
  console.log(`[LLM] Waiting for user approval before fallback`);
  
  throw new FallbackRequiredError(
    resolvedProvider, 
    fallbackProvider, 
    `${resolvedProvider === 'groq' ? 'Groq' : 'Gemini'} is currently unavailable after multiple attempts. Error: ${lastErrorMsg}`
  );
}

// Helper to convert error to JSON response in API routes
export function handleLLMError(err: unknown) {
  if (err instanceof FallbackRequiredError) {
    return NextResponse.json({
      success: false,
      fallbackAvailable: true,
      failedProvider: err.failedProvider,
      fallbackProvider: err.fallbackProvider,
      error: err.message
    }, { status: 503 }); // 503 Service Unavailable, custom JSON body
  }
  
  console.error('[LLM] Unhandled generation error:', err);
  const msg = err instanceof Error ? err.message : 'AI generation failed';
  return NextResponse.json({ success: false, error: msg }, { status: 500 });
}
