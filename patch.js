const fs = require('fs');
const path = require('path');

function patchAuth(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('getAppSession')) return;

  const authImport = import { getAppSession } from "@/lib/auth";\n;
  content = content.replace(/import \{.*?\} from "next\/server";/, match => authImport + match);
  content = content.replace(/import \{.*?\} from 'next\/server';/, match => authImport + match);

  const authCheckPOST = 
    const res = NextResponse.json({});
    const userSession = await getAppSession(req as unknown as Request, res as unknown as Response);
    if (!userSession?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
;
  const authCheckGET = 
    const res = NextResponse.json({});
    const userSession = await getAppSession(req as unknown as Request, res as unknown as Response);
    if (!userSession?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
;

  if (content.includes('export async function POST(req: NextRequest) {')) {
    content = content.replace(/export async function POST\(req: NextRequest\) \{\s*try \{/, match => match + authCheckPOST);
  } else if (content.includes('export async function POST(req: Request) {')) {
     content = content.replace(/export async function POST\(req: Request\) \{\s*try \{/, match => match + authCheckPOST);
  }

  if (content.includes('export async function GET(req: NextRequest) {')) {
    content = content.replace(/export async function GET\(req: NextRequest\) \{\s*try \{/, match => match + authCheckGET);
  }

  content = content.replace(/if \(\!session\) return NextResponse\.json\(\{ error: "Not found" \}, \{ status: 404 \}\);/g, if (!session || session.interviewerId !== userSession.userId) return NextResponse.json({ error: "Not found" }, { status: 404 }););
  content = content.replace(/if \(\!session \|\| session\.status \!\=\= 'active'\) \{/g, if (!session || session.interviewerId !== userSession.userId || session.status !== 'active') {);
  content = content.replace(/if \(\!sessionObj\) \{/, if (!sessionObj || sessionObj.interviewerId !== userSession.userId) {);
  content = content.replace(/if \(\!session\) \{/, if (!session || session.interviewerId !== userSession.userId) {);

  fs.writeFileSync(filePath, content);
  console.log('Patched ' + filePath);
}

patchAuth('app/api/interview/end/route.ts');
patchAuth('app/api/interview/resume/route.ts');
patchAuth('app/api/interview/select-question/route.ts');
