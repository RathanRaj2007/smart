async function run() {
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Admin@123' })
  });
  const cookie = loginRes.headers.get('set-cookie');

  const start = Date.now();
  const res = await fetch('http://localhost:3001/api/admin/analytics', {
    headers: { 'cookie': cookie }
  });
  const end = Date.now();
  const data = await res.json();

  console.log(`Analytics API Response Time: ${end - start}ms`);
  console.log(`Interviewers fetched: ${data.interviewerPerformance?.length || 0}`);
}
run();
