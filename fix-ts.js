const fs = require('fs');
let content = fs.readFileSync('lib/llm/index.ts', 'utf8');
content = content.replace('catch (err: any) {', 'catch (err: unknown) {');
content = content.replace("const errorMsg = err?.message || 'Unknown error';", "const errorMsg = err instanceof Error ? err.message : 'Unknown error';");
fs.writeFileSync('lib/llm/index.ts', content);

let iview = fs.readFileSync('app/(auth)/interview/page.tsx', 'utf8');
iview = iview.replace("const fetchWithFallback = useFallbackFetch();", "");
fs.writeFileSync('app/(auth)/interview/page.tsx', iview);
console.log('Fixed');
