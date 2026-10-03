const assert = require('assert');

async function testAuth() {
  const baseUrl = 'http://localhost:3001';
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'StrongPassword!123';
  
  console.log('--- Testing Auth Flow ---');
  
  // 1. Invalid Login (User does not exist)
  console.log('\nTesting: Invalid Login');
  let res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'nonexistent', password: 'wrongpassword' })
  });
  let data = await res.json();
  console.log('Invalid Login Status:', res.status, data);
  assert.strictEqual(res.status, 401, 'Should reject nonexistent user');
  
  // 2. Registration
  console.log('\nTesting: Registration');
  res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email, password, role: 'CANDIDATE' })
  });
  data = await res.json();
  console.log('Registration Status:', res.status, data);
  assert.strictEqual(res.status, 201, 'Should create account successfully');
  assert.strictEqual(data.success, true, 'Should return success true');
  
  // 3. Login
  console.log('\nTesting: Login');
  res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password })
  });
  data = await res.json();
  const cookies = res.headers.get('set-cookie');
  console.log('Login Status:', res.status, data);
  assert.strictEqual(res.status, 200, 'Should login successfully');
  assert.ok(cookies?.includes('smartinterview_session'), 'Should set iron-session cookie');
  assert.strictEqual(data.redirect, '/candidate', 'Should redirect to candidate dashboard');
  
  // 4. Logout
  console.log('\nTesting: Logout');
  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { 'cookie': cookies }
  });
  const logoutData = await logoutRes.json();
  const logoutCookies = logoutRes.headers.get('set-cookie');
  console.log('Logout Status:', logoutRes.status, logoutData);
  assert.strictEqual(logoutRes.status, 200, 'Should logout successfully');
  assert.ok(logoutCookies?.includes('smartinterview_session=;'), 'Should clear iron-session cookie');

  console.log('\nALL TESTS PASSED SUCCESSFULLY! No OTP was triggered.');
}

testAuth().catch(e => {
  console.error('\nTest failed:', e.message);
  process.exit(1);
});
