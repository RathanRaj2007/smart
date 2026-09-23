// Idempotent patch for Next.js recursive-delete on Windows OneDrive reparse points
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const filesToPatch = [
  path.join(root, 'node_modules/next/dist/lib/recursive-delete.js'),
  path.join(root, 'node_modules/next/dist/esm/lib/recursive-delete.js'),
];

for (const file of filesToPatch) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Replace unguarded readlink with try/catch to handle OneDrive reparse points
  const targetPatternCjs = 'const linkPath = await _fs.promises.readlink(absolutePath);';
  const targetPatternEsm = 'const linkPath = await promises.readlink(absolutePath);';

  if (content.includes(targetPatternCjs) && !content.includes('isSymlink = false')) {
    content = content.replace(
      targetPatternCjs,
      'let linkPath; try { linkPath = await _fs.promises.readlink(absolutePath); } catch { isSymlink = false; }'
    );
    fs.writeFileSync(file, content, 'utf8');
    console.log(`[patch-next] Applied OneDrive reparse-point patch to ${path.basename(file)}`);
  } else if (content.includes(targetPatternEsm) && !content.includes('isSymlink = false')) {
    content = content.replace(
      targetPatternEsm,
      'let linkPath; try { linkPath = await promises.readlink(absolutePath); } catch { isSymlink = false; }'
    );
    fs.writeFileSync(file, content, 'utf8');
    console.log(`[patch-next] Applied OneDrive reparse-point patch to ${path.basename(file)}`);
  }
}
