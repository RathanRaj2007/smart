const fs = require('fs');
let content = fs.readFileSync('components/KnowledgeBaseClient.tsx', 'utf8');

if (!content.includes('import { useFallbackFetch }')) {
  if (content.includes("import { useState, useEffect } from 'react';")) {
    content = content.replace(
      "import { useState, useEffect } from 'react';",
      "import { useState, useEffect } from 'react';\nimport { useFallbackFetch } from '@/components/providers/FallbackProvider';"
    );
  } else if (content.includes('import { useState, useEffect } from "react";')) {
    content = content.replace(
      'import { useState, useEffect } from "react";',
      'import { useState, useEffect } from "react";\nimport { useFallbackFetch } from "@/components/providers/FallbackProvider";'
    );
  }
}

if (!content.includes('const fetchWithFallback = useFallbackFetch();')) {
  content = content.replace(
    'export default function KnowledgeBaseClient() {',
    'export default function KnowledgeBaseClient() {\n  const fetchWithFallback = useFallbackFetch();'
  );
}

content = content.replace(/const res = await fetch\('\/api\/rag\/query'/g, "const res = await fetchWithFallback('/api/rag/query'");

fs.writeFileSync('components/KnowledgeBaseClient.tsx', content);
console.log('Fixed KnowledgeBaseClient');
