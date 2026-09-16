const fs = require('fs');

let content = fs.readFileSync('app/(auth)/interview/page.tsx', 'utf8');

if (!content.includes('const fetchWithFallback = useFallbackFetch();')) {
  content = content.replace(
    'export default function InterviewPage() {',
    'export default function InterviewPage() {\n  const fetchWithFallback = useFallbackFetch();'
  );
}

content = content.replace(/await fetch\("\/api\/interview\/start"/g, 'await fetchWithFallback("/api/interview/start"');
content = content.replace(/await fetch\("\/api\/interview\/evaluate"/g, 'await fetchWithFallback("/api/interview/evaluate"');
content = content.replace(/await fetch\("\/api\/interview\/end"/g, 'await fetchWithFallback("/api/interview/end"');
content = content.replace(/await fetch\("\/api\/interview\/select-question"/g, 'await fetchWithFallback("/api/interview/select-question"');

fs.writeFileSync('app/(auth)/interview/page.tsx', content);
console.log('Fixed fetch in interview page');
