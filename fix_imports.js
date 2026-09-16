const fs = require('fs');
const path = require('path');
const files = [
  'app/(auth)/layout.tsx',
  'app/api/auth/login/route.ts',
  'app/api/auth/logout/route.ts',
  'app/api/documents/[id]/route.ts',
  'app/api/documents/route.ts',
  'app/api/documents/search/route.ts',
  'app/api/rag/query/route.ts'
];
for (const file of files) {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/import \{.*?\} from '@\/lib\/auth'/, "import { getAppSession, SERVER_INSTANCE_ID } from '@/lib/auth'");
  if (file === 'app/(auth)/layout.tsx') {
    content = content.replace(/import \{ cookies \} from 'next\/headers'\n/, '');
  }
  fs.writeFileSync(filePath, content);
  console.log('Fixed imports in ' + file);
}
