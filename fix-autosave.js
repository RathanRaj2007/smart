const fs = require('fs');
let code = fs.readFileSync('components/providers/InterviewStateProvider.tsx', 'utf8');

code = code.replace(
  '// Synchronize initial state with cookies',
  "// Keep cookie in sync with state changes\n  useEffect(() => {\n    if (state.selectedLLM) {\n      Cookies.set('selectedLLM', state.selectedLLM, { expires: 365, path: '/' });\n    }\n  }, [state.selectedLLM]);\n\n  // Synchronize initial state with cookies"
);

fs.writeFileSync('components/providers/InterviewStateProvider.tsx', code);
console.log('Fixed InterviewStateProvider to auto-save cookie');
