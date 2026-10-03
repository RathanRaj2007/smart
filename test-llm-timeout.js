const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testTimeout() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'fake');
  const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1); // 1ms timeout

  try {
    console.log('Sending request...');
    await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
    }, { signal: controller.signal });
    console.log('Success (should not happen)');
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Timeout works: request was aborted!');
    } else {
      console.error('Failed with other error:', err.message);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

testTimeout();
