const fs = require('fs');
let code = fs.readFileSync('app/api/rag/query/route.ts', 'utf8');
code = code.replace(
  'const { text: answer, provider } = await generateLLMResponse(prompt, forceProvider)',
  'const { cookies } = await import("next/headers");\n    const cookieStore = await cookies();\n    console.log("[RAG API] Cookies:", cookieStore.getAll().map(c => c.name + "=" + c.value).join(" "));\n    const { text: answer, provider } = await generateLLMResponse(prompt, forceProvider)'
);
fs.writeFileSync('app/api/rag/query/route.ts', code);
console.log('Added cookie logging');
