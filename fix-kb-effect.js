const fs = require('fs');
let code = fs.readFileSync('components/KnowledgeBaseClient.tsx', 'utf8');

if (!code.includes('const fetchedRef = useRef(false)')) {
  code = code.replace(
    "import React, { useEffect, useState } from 'react'",
    "import React, { useEffect, useState, useRef } from 'react'"
  );
  
  code = code.replace(
    "useEffect(() => { fetchDocs() }, [])",
    "const fetchedRef = useRef(false);\n  useEffect(() => {\n    if (!fetchedRef.current) {\n      fetchedRef.current = true;\n      fetchDocs();\n    }\n  }, [])"
  );
}

fs.writeFileSync('components/KnowledgeBaseClient.tsx', code);
console.log('Fixed KnowledgeBaseClient useEffect');
