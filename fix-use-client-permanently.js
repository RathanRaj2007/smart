const fs = require('fs');

function nukeAndPrependUseClient(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/"use client";?/g, '');
  content = content.replace(/'use client';?/g, '');
  content = content.trimStart();
  content = '"use client";\n' + content;
  fs.writeFileSync(file, content);
}

nukeAndPrependUseClient('app/(auth)/interview/page.tsx');
nukeAndPrependUseClient('components/KnowledgeBaseClient.tsx');
console.log('Fixed use client permanently');
