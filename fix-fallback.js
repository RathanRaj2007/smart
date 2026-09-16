const fs = require('fs');
let code = fs.readFileSync('components/providers/FallbackProvider.tsx', 'utf8');

code = code.replace(
  'const res = await fetch(url, options);',
  "const fetchOptions = { credentials: 'include' as RequestCredentials, ...options };\n    const res = await fetch(url, fetchOptions);"
);

code = code.replace(
  'return fetch(url, { ...options, body: newBody });',
  "return fetch(url, { ...fetchOptions, body: newBody });"
);

fs.writeFileSync('components/providers/FallbackProvider.tsx', code);
console.log('Fixed fetchWithFallback credentials');
