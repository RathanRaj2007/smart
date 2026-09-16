const fs = require('fs');
let code = fs.readFileSync('app/api/rag/query/route.ts', 'utf8');

code = code.replace(
  'console.log("[RAG API] Cookies:", cookieStore.getAll().map(c => c.name + "=" + c.value).join(" "));',
  'console.log(`[LLM DEBUG] selectedLLM=${cookieStore.get("selectedLLM")?.value}`);'
);

fs.writeFileSync('app/api/rag/query/route.ts', code);
console.log('Fixed cookie logging');
