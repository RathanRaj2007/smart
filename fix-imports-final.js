const fs = require('fs');

let content = fs.readFileSync('app/(auth)/interview/page.tsx', 'utf8');
if (!content.includes('import { useFallbackFetch }')) {
  content = 'import { useFallbackFetch } from "@/components/providers/FallbackProvider";\n' + content;
  fs.writeFileSync('app/(auth)/interview/page.tsx', content);
}

let kb = fs.readFileSync('components/KnowledgeBaseClient.tsx', 'utf8');
if (!kb.includes('import { useFallbackFetch }')) {
  kb = 'import { useFallbackFetch } from "@/components/providers/FallbackProvider";\n' + kb;
  fs.writeFileSync('components/KnowledgeBaseClient.tsx', kb);
}

console.log('Fixed imports definitively');
