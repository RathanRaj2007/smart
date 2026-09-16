const fs = require('fs');

function enforceUseClient(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('"use client"')) {
    content = content.replace(/"use client";\s*/g, '');
    content = '"use client";\n' + content;
    fs.writeFileSync(file, content);
  } else if (content.includes("'use client'")) {
    content = content.replace(/'use client';\s*/g, '');
    content = "'use client';\n" + content;
    fs.writeFileSync(file, content);
  }
}

enforceUseClient('app/(auth)/interview/page.tsx');
enforceUseClient('components/KnowledgeBaseClient.tsx');
console.log('Fixed use client');
