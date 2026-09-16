const fs = require('fs');
let code = fs.readFileSync('app/(auth)/interview/page.tsx', 'utf8');

if (!code.includes('const docsFetchedRef = useRef(false);')) {
  code = code.replace(
    'useEffect(() => {',
    'const docsFetchedRef = useRef(false);\n  useEffect(() => {\n    if (docsFetchedRef.current) return;\n    docsFetchedRef.current = true;'
  );
}

if (!code.includes('const resumeFetchedRef = useRef(false);')) {
  // Second useEffect is usually after "// Restore session"
  code = code.replace(
    '// Restore session\n  useEffect(() => {',
    '// Restore session\n  const resumeFetchedRef = useRef(false);\n  useEffect(() => {\n    if (resumeFetchedRef.current) return;\n    resumeFetchedRef.current = true;'
  );
}

fs.writeFileSync('app/(auth)/interview/page.tsx', code);
console.log('Fixed interview page useEffect');
