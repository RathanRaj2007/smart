const fs = require('fs');

async function run() {
  console.log('Logging in...');
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Admin@123' })
  });
  
  const cookie = loginRes.headers.get('set-cookie');
  if (!cookie) throw new Error('No cookie received');
  console.log('Logged in successfully.');

  const form = new FormData();
  form.append('title', 'Test PDF');
  form.append('file', new Blob(['Hello World! This is a test document for embedding generation. It has some text about machine learning and artificial intelligence.'], { type: 'text/plain' }), 'test.txt');

  console.log('Uploading document...');
  const start = Date.now();
  const uploadRes = await fetch('http://localhost:3001/api/documents', {
    method: 'POST',
    headers: { 'cookie': cookie },
    body: form
  });
  const end = Date.now();

  const data = await uploadRes.text();
  console.log(`API Response Time: ${end - start}ms`);
  console.log('Response:', data);
}

run().catch(console.error);
