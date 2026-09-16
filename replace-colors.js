const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, files);
    } else if (fullPath.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = [...getFiles('app'), ...getFiles('components')];
let changedFiles = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Backgrounds
  content = content.replace(/background:\s*'#070913'/g, "background: 'var(--color-bg-primary)'");
  content = content.replace(/background:\s*'#0B1121'/g, "background: 'var(--color-card-bg)'");
  content = content.replace(/background:\s*'rgba\(15,23,42,0\.3\)'/g, "background: 'var(--color-bg-tertiary)'");
  content = content.replace(/background:\s*'rgba\(30,41,59,0\.5\)'/g, "background: 'var(--color-bg-tertiary)'");
  content = content.replace(/backgroundColor:\s*'#0B1121'/g, "backgroundColor: 'var(--color-card-bg)'");
  content = content.replace(/background:\s*'rgba\(255,255,255,0\.02\)'/g, "background: 'var(--color-bg-tertiary)'");
  content = content.replace(/background:\s*'rgba\(255,255,255,0\.03\)'/g, "background: 'var(--color-bg-secondary)'");
  content = content.replace(/background:\s*'rgba\(255,255,255,0\.05\)'/g, "background: 'var(--color-bg-tertiary)'");
  content = content.replace(/background:\s*'rgba\(0,0,0,0\.2\)'/g, "background: 'var(--color-bg-tertiary)'");

  // Text
  content = content.replace(/color:\s*'#f8fafc'/g, "color: 'var(--color-text-primary)'");
  content = content.replace(/color:\s*'#e2e8f0'/g, "color: 'var(--color-text-primary)'");
  content = content.replace(/color:\s*'white'/g, "color: 'var(--color-text-primary)'");
  content = content.replace(/color:\s*'#fff'/g, "color: 'var(--color-text-primary)'");
  content = content.replace(/color:\s*'#94a3b8'/g, "color: 'var(--color-text-secondary)'");
  content = content.replace(/color:\s*'#64748b'/g, "color: 'var(--color-text-muted)'");
  content = content.replace(/color:\s*'#cbd5e1'/g, "color: 'var(--color-text-secondary)'");

  // Borders
  content = content.replace(/border:\s*'1px solid rgba\(255,255,255,0\.05\)'/g, "border: '1px solid var(--color-card-border)'");
  content = content.replace(/borderBottom:\s*'1px solid rgba\(255,255,255,0\.05\)'/g, "borderBottom: '1px solid var(--color-card-border)'");
  content = content.replace(/borderTop:\s*'1px solid rgba\(255,255,255,0\.05\)'/g, "borderTop: '1px solid var(--color-card-border)'");
  content = content.replace(/borderLeft:\s*'1px solid rgba\(255,255,255,0\.05\)'/g, "borderLeft: '1px solid var(--color-card-border)'");
  content = content.replace(/borderRight:\s*'1px solid rgba\(255,255,255,0\.05\)'/g, "borderRight: '1px solid var(--color-card-border)'");
  content = content.replace(/border:\s*'1px solid rgba\(255,255,255,0\.1\)'/g, "border: '1px solid var(--color-card-border)'");
  content = content.replace(/borderBottom:\s*'1px solid rgba\(255,255,255,0\.1\)'/g, "borderBottom: '1px solid var(--color-card-border)'");
  content = content.replace(/borderTop:\s*'1px solid rgba\(255,255,255,0\.1\)'/g, "borderTop: '1px solid var(--color-card-border)'");

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
    console.log('Updated', file);
  }
}
console.log('Total files changed:', changedFiles);
