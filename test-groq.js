const http = require('http');

const postData = JSON.stringify({
  candidateName: "Test",
  subject: "Math"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/interview/start',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Cookie': 'selectedLLM=groq'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`BODY: ${data}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
