# SmartInterview Fix Walkthrough

## 1. Provider Selection Fix (Groq vs Gemini)
- **Root Cause**: The client-side Settings page used `js-cookie` to set the `selectedLLM` cookie, but without explicitly passing `{ path: '/' }`. This resulted in the cookie not being consistently sent to the `/api/rag/query` routes. Furthermore, `lib/llm/index.ts` had fallback logic that silently coerced the provider to Gemini if the cookie couldn't be parsed or read by the server. 
- **Fix Applied**: 
  - Updated `app/(auth)/settings/page.tsx` to set the cookie properly: `Cookies.set('selectedLLM', state.selectedLLM, { expires: 365, path: '/' })`.
  - Re-wrote `lib/llm/index.ts` resolution. It now reads `cookieStore.get('selectedLLM')`, strictly validates it as exactly `'groq'` or `'gemini'`, and logs precisely: `[LLM] Selected provider: groq` to the terminal so backend selection is totally transparent.
  - No silent switching: If `groq` fails, it returns a 503 `FallbackRequiredError` triggering the user popup.

## 2. RAG Specific Fixes
- **Root Cause**: RAG relies on plain text output. `lib/llm/groq.ts` was hardcoding `response_format: { type: "json_object" }` unconditionally for ALL Groq requests, which broke text-only RAG queries (Groq requires the prompt to explicitly ask for JSON if `json_object` is enabled).
- **Fix Applied**: Dynamically apply `response_format: { type: "json_object" }` only if the prompt actually contains the word `"json"`. RAG cosine similarity (Xenova + pgvector) remains 100% local and untouched, completely bypassing the LLM step for vectorization.

## 3. UI and Performance Responsiveness 
- **Sidebar Over-Fetching**: 
  - **Root Cause**: Next.js 14+ `<Link>` tags aggressively prefetch by default. The sidebar contained links to 6 heavy Server Components (`/report`, `/knowledge-base`, `/suggestions`, etc.). As soon as the page loaded, Next.js tried to execute all those database-heavy layouts simultaneously! 
  - **Fix Applied**: Added `prefetch={false}` to Sidebar navigation items. Now navigation remains fast on click, but doesn't DDoS the dev server on mount.
- **Double Fetching / Log Spam**: 
  - Disabled `reactStrictMode` in `next.config.ts` to prevent the double `useEffect` mount behaviors during development. 
  - Removed 4 accidentally copy-pasted `console.log('[LLM] Gemini request started')` lines from `lib/llm/gemini.ts`.

## 4. Fallback Architecture Preserved
- The fallback interceptor `FallbackProvider.tsx` safely replays the exact same request using `forceProvider` if the user clicks "Yes, Use Gemini/Groq". It completely respects the application boundary without overwriting the global persistent `selectedLLM` cookie.
