const fs = require('fs');

function fixEvaluate() {
  let content = fs.readFileSync('app/api/interview/evaluate/route.ts', 'utf8');

  content = content.replace(
    'const { sessionId, questionId, transcript } = await req.json();',
    'const { sessionId, questionId, transcript, forceProvider } = await req.json();'
  );

  content = content.replace(
    /generateLLMResponse\(evaluatorPrompt \+ "\\n\\nReply in strict JSON format\."\)/g,
    'generateLLMResponse(evaluatorPrompt + "\\n\\nReply in strict JSON format.", forceProvider)'
  );
  content = content.replace(
    /generateLLMResponse\(generatorPrompt \+ "\\n\\nReply in strict JSON format\."\)/g,
    'generateLLMResponse(generatorPrompt + "\\n\\nReply in strict JSON format.", forceProvider)'
  );

  content = content.replace(
    /\} catch \(error\) \{[\s\S]*?console\.error[\s\S]*?return NextResponse\.json[\s\S]*?\}/,
    '} catch (error: unknown) {\n    const { handleLLMError } = await import(\'@/lib/llm\');\n    return handleLLMError(error);\n  }'
  );

  fs.writeFileSync('app/api/interview/evaluate/route.ts', content);
}

function fixEnd() {
  let content = fs.readFileSync('app/api/interview/end/route.ts', 'utf8');

  content = content.replace(
    'const { sessionId } = await req.json();',
    'const { sessionId, forceProvider } = await req.json();'
  );

  content = content.replace(
    /generateLLMResponse\(prompt \+ "\\n\\nOutput JSON only\."\)/g,
    'generateLLMResponse(prompt + "\\n\\nOutput JSON only.", forceProvider)'
  );

  content = content.replace(
    /\} catch \(error\) \{[\s\S]*?console\.error[\s\S]*?return NextResponse\.json[\s\S]*?\}/,
    '} catch (error: unknown) {\n    const { handleLLMError } = await import(\'@/lib/llm\');\n    return handleLLMError(error);\n  }'
  );

  fs.writeFileSync('app/api/interview/end/route.ts', content);
}

fixEvaluate();
fixEnd();
console.log('Fixed evaluate and end routes');
