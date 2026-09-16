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

  try {
    if (resolvedProvider === 'groq') {
      console.log(`[LLM] Groq request started`);
      const text = await generateGroqResponse(prompt);
      console.log(`[LLM] Groq request successful`);
      return { text, provider: 'groq' };
    } else {
      console.log(`[LLM] Gemini request started`);
      const text = await generateGeminiResponse(prompt);
      console.log(`[LLM] Gemini request successful`);
      return { text, provider: 'gemini' };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    
    // Log technical detail to server only
    console.error(`[LLM] ${resolvedProvider} request failed:`, errorMsg);

    // If there's an API key configuration issue, do not ask for fallback endless loop, throw normal error.
    if (errorMsg.toLowerCase().includes('api key not valid') || errorMsg.toLowerCase().includes('invalid api key')) {
      throw new Error(`Configuration Error: Invalid ${resolvedProvider} API Key`);
    }

    const fallbackProvider = resolvedProvider === 'groq' ? 'gemini' : 'groq';
    console.log(`[LLM] Waiting for user approval before fallback`);
    
    throw new FallbackRequiredError(
      resolvedProvider, 
      fallbackProvider, 
      `${resolvedProvider === 'groq' ? 'Groq' : 'Gemini'} is currently unavailable.`
    );
  }
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
