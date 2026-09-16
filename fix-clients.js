const fs = require('fs');

function fixKnowledgeBase() {
  let content = fs.readFileSync('components/KnowledgeBaseClient.tsx', 'utf8');

  if (!content.includes('useFallbackFetch')) {
    content = content.replace(
      'import { useState, useEffect } from "react";',
      'import { useState, useEffect } from "react";\nimport { useFallbackFetch } from "@/components/providers/FallbackProvider";'
    );
    // Might use single quotes
    content = content.replace(
      "import { useState, useEffect } from 'react';",
      "import { useState, useEffect } from 'react';\nimport { useFallbackFetch } from '@/components/providers/FallbackProvider';"
    );
  }

  if (!content.includes('const fetchWithFallback = useFallbackFetch();')) {
    content = content.replace(
      'export default function KnowledgeBaseClient() {',
      'export default function KnowledgeBaseClient() {\n  const fetchWithFallback = useFallbackFetch();'
    );
  }

  content = content.replace(
    /const res = await fetch\('\/api\/rag\/query'/g,
    "const res = await fetchWithFallback('/api/rag/query'"
  );

  fs.writeFileSync('components/KnowledgeBaseClient.tsx', content);
}

function fixInterviewPage() {
  let content = fs.readFileSync('app/(auth)/interview/page.tsx', 'utf8');

  if (!content.includes('useFallbackFetch')) {
    content = content.replace(
      "import { useState, useEffect, useRef } from 'react';",
      "import { useState, useEffect, useRef } from 'react';\nimport { useFallbackFetch } from '@/components/providers/FallbackProvider';"
    );
  }

  if (!content.includes('const fetchWithFallback = useFallbackFetch();')) {
    content = content.replace(
      'export default function InterviewPage() {',
      'export default function InterviewPage() {\n  const fetchWithFallback = useFallbackFetch();'
    );
  }

  content = content.replace(
    /const res = await fetch\('\/api\/interview\//g,
    "const res = await fetchWithFallback('/api/interview/"
  );
  
  content = content.replace(
    /const endRes = await fetch\('\/api\/interview\/end'/g,
    "const endRes = await fetchWithFallback('/api/interview/end'"
  );

  fs.writeFileSync('app/(auth)/interview/page.tsx', content);
}

fixKnowledgeBase();
fixInterviewPage();
console.log('Fixed client components');
