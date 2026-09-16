const fs = require('fs');
let code = fs.readFileSync('lib/llm/index.ts', 'utf8');

code = code.replace(
  "  let resolvedProvider = 'gemini'; // default",
  "  let resolvedProvider: string | null = null;"
);

code = code.replace(
  "  } else if (storedLLM === 'gemini' || storedLLM === 'groq') {\n    resolvedProvider = storedLLM;\n  }",
  "  } else if (storedLLM === 'gemini' || storedLLM === 'groq') {\n    resolvedProvider = storedLLM;\n  }\n\n  if (!resolvedProvider) {\n    throw new Error('Configuration Error: No LLM provider selected. Please select a provider in Settings.');\n  }"
);

fs.writeFileSync('lib/llm/index.ts', code);
console.log('Fixed provider selection logic');
