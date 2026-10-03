// fetch is available globally in Node 24

async function main() {
  const res = await fetch('http://localhost:3001/api/auth/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'battularathanraj6@gmail.com',
      role: 'CANDIDATE'
    })
  });
  const data = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', data);
}
main().catch(console.error);
