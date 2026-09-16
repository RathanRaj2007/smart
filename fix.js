const fs = require('fs');
const path = require('path');
const files = ['app/(auth)/layout.tsx', 'app/api/auth/login/route.ts', 'app/api/auth/logout/route.ts', 'app/api/documents/[id]/route.ts', 'app/api/documents/route.ts', 'app/api/documents/search/route.ts', 'app/api/interview/start/route.ts', 'app/api/rag/query/route.ts'];
for (const file of files) {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace("import { getIronSession } from 'iron-session'", "");
  content = content.replace(/import \{ sessionOptions, SessionData \} from '([^']+)'/, "import { sessionOptions, SessionData, getAppSession, SERVER_INSTANCE_ID } from '$1'");
  content = content.replace('const { getIronSession } = await import("iron-session");', 'const { getAppSession } = await import("@/lib/auth");');
  content = content.replace(/getIronSession<SessionData>\(await cookies\(\), sessionOptions\)/g, 'getAppSession()');
  content = content.replace(/getIronSession<SessionData>\(request, response, sessionOptions\)/g, 'getAppSession(request, response)');
  content = content.replace(/getIronSession<SessionData>\(req as unknown as Request, res as unknown as Response, sessionOptions\)/g, 'getAppSession(req as unknown as Request, res as unknown as Response)');
  fs.writeFileSync(filePath, content);
  console.log('Updated ' + file);
}
