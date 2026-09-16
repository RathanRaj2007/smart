const fs = require('fs');
let content = fs.readFileSync('app/(auth)/interview/page.tsx', 'utf8');

if (!content.includes('import { useFallbackFetch }')) {
  if (content.includes("import { useState, useEffect, useRef } from 'react';")) {
    content = content.replace(
      "import { useState, useEffect, useRef } from 'react';",
      "import { useState, useEffect, useRef } from 'react';\nimport { useFallbackFetch } from '@/components/providers/FallbackProvider';"
    );
  } else if (content.includes('import { useState, useEffect, useRef } from "react";')) {
    content = content.replace(
      'import { useState, useEffect, useRef } from "react";',
      'import { useState, useEffect, useRef } from "react";\nimport { useFallbackFetch } from "@/components/providers/FallbackProvider";'
    );
  }
}

fs.writeFileSync('app/(auth)/interview/page.tsx', content);
console.log('Fixed');
