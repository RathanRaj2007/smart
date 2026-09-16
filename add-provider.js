const fs = require('fs');

function addProviderToInterview() {
  let content = fs.readFileSync('app/(auth)/interview/page.tsx', 'utf8');

  if (!content.includes('const [activeProvider, setActiveProvider] = useState<string>("")')) {
    content = content.replace(
      'const [error, setError] = useState<string | null>(null);',
      'const [error, setError] = useState<string | null>(null);\n  const [activeProvider, setActiveProvider] = useState<string>("");'
    );
  }

  // Update setActiveProvider on start
  if (!content.includes('setActiveProvider(data.provider)')) {
    content = content.replace(
      'setSessionId(data.sessionId);',
      'setSessionId(data.sessionId);\n      if (data.provider) setActiveProvider(data.provider);'
    );
  }

  // Same for evaluate response if it updates
  content = content.replace(
    'setCurrentQuestion(data.nextQuestion);',
    'setCurrentQuestion(data.nextQuestion);\n      if (data.providerUsed) setActiveProvider(data.providerUsed);'
  );

  // Add the badge to the Header of the interview page
  if (!content.includes('activeProvider.toUpperCase()')) {
    content = content.replace(
      '<span style={{ color: \'var(--color-text-secondary)\' }}>Session Active</span>',
      '<span style={{ color: \'var(--color-text-secondary)\' }}>Session Active &bull; AI: {activeProvider.toUpperCase()}</span>'
    );
  }

  fs.writeFileSync('app/(auth)/interview/page.tsx', content);
}

addProviderToInterview();
console.log('Added provider display');
