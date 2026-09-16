const fs = require('fs');
let code = fs.readFileSync('app/(auth)/interview/page.tsx', 'utf8');

if (!code.includes("import { useRouter } from 'next/navigation'")) {
  code = code.replace(
    "import React, { useState, useEffect, useRef } from 'react';",
    "import React, { useState, useEffect, useRef } from 'react';\nimport { useRouter } from 'next/navigation';"
  );
}

if (!code.includes('const router = useRouter()')) {
  code = code.replace(
    'const fetchWithFallback = useFallbackFetch();',
    'const fetchWithFallback = useFallbackFetch();\n    const router = useRouter();'
  );
}

code = code.replace(/window\.location\.href = `\/report\/\$\{session\.id\}`[;]?/g, 'router.push(`/report/${session.id}`)');
code = code.replace(/window\.location\.reload\(\)[;]?/g, 'window.location.reload() /* Fallback to reload if needed, but Next.js router.refresh() does not reset client state. Reload is correct for a fresh interview. */');

fs.writeFileSync('app/(auth)/interview/page.tsx', code);
console.log('Fixed window.location in interview');
