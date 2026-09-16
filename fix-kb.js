const fs = require('fs');
let content = fs.readFileSync('components/KnowledgeBaseClient.tsx', 'utf8');

if (!content.includes('const fetchWithFallback = useFallbackFetch();')) {
  content = content.replace(
    'export const KnowledgeBaseClient = () => {',
    'export const KnowledgeBaseClient = () => {\n  const fetchWithFallback = useFallbackFetch();'
  );
}

// Fix the duplicated use client that might be causing the unused expression error on line 3
content = content.replace(/"use client";[\s\n]*"use client";/g, '"use client";');
content = content.replace(/'use client';[\s\n]*'use client';/g, "'use client';");

fs.writeFileSync('components/KnowledgeBaseClient.tsx', content);
console.log('Fixed KB');
