const fs = require('fs');

function cleanLogin() {
  let content = fs.readFileSync('app/login/page.tsx', 'utf8');

  // 1. Remove OtpInput Helper block
  const otpHelperStart = content.indexOf('// ─── Helper: OTP digit input');
  const helperEnd = content.indexOf('export default function LoginPage() {');
  if (otpHelperStart !== -1 && helperEnd !== -1) {
    content = content.slice(0, otpHelperStart) + content.slice(helperEnd);
  }

  // 2. Remove specific React imports
  content = content.replace(/, useCallback/g, '');

  // 3. Types
  content = content.replace(/ \| 'otp'/g, '');

  // 4. Remove States
  content = content.replace(/  \/\/ OTP stage[\s\S]*?const otpString = otpDigits\.join\(''\)\r?\n/g, '');

  // 5. Clean useSearchParams effect
  content = content.replace(/    \/\/ After registration[\s\S]*?    \}\r?\n/g, '');
  content = content.replace(/    setOtpDigits\(\['', '', '', '', '', ''\]\)\r?\n/g, '');

  // 6. Clean Login Handle (data.otpRequired)
  content = content.replace(/      \} else if \(data\.otpRequired\) \{[\s\S]*?\} catch \(err\) \{/g, "} catch (err) {");

  // 7. Clean Resend / Verify
  const resendStart = content.indexOf('// ─── Resend OTP');
  const verifyEnd = content.indexOf('// ─── Forgot Password');
  if (resendStart !== -1 && verifyEnd !== -1) {
    content = content.slice(0, resendStart) + content.slice(verifyEnd);
  }

  // 8. Clean Stepper
  content = content.replace(/              \{\(\['password', 'otp'\][\s\S]*?              <\/div>\r?\n/g, '');

  // 9. Remove STAGE: otp
  const stageOtpStart = content.indexOf('{/* ── STAGE: otp ── */}');
  const registerLinkStart = content.indexOf('{/* Register link */}');
  if (stageOtpStart !== -1 && registerLinkStart !== -1) {
    content = content.slice(0, stageOtpStart) + content.slice(registerLinkStart);
  }

  fs.writeFileSync('app/login/page.tsx', content);
}

function cleanRegister() {
  let content = fs.readFileSync('app/register/page.tsx', 'utf8');

  // 1. Remove OtpInput Helper block
  const otpHelperStart = content.indexOf('// ─── Helper: OTP digit input');
  const helperEnd = content.indexOf('export default function RegisterPage() {');
  if (otpHelperStart !== -1 && helperEnd !== -1) {
    content = content.slice(0, otpHelperStart) + content.slice(helperEnd);
  }

  // 2. Remove specific React imports
  content = content.replace(/, useCallback/g, '');
  content = content.replace(/useCallback, /g, '');

  // 3. Types
  content = content.replace(/type RegStage = 'form' \| 'otp'\r?\n/, '');

  // 4. Remove States
  content = content.replace(/  \/\/ OTP stage[\s\S]*?const otpString = otpDigits\.join\(''\)\r?\n/g, '');
  
  // 5. Remove useEffect cooldown
  content = content.replace(/  \/\/ Cooldown timer[\s\S]*?\}, \[resendCooldown\]\)\r?\n/g, '');

  // 6. Remove Resend / Verify
  const resendStart = content.indexOf('// ── Resend OTP');
  const verifyEnd = content.indexOf('// ── END ──');
  if (resendStart !== -1 && verifyEnd !== -1) {
    content = content.slice(0, resendStart) + content.slice(verifyEnd + 12);
  }

  // 7. Fix handleRegister redirect
  const otpTransition = /      \/\/ Transition to OTP step in-page[\s\S]*?setOtpDigits\(\['', '', '', '', '', ''\]\)/;
  content = content.replace(otpTransition, "      // Redirect to login page\n      setSuccessMsg(data.message || 'Account created successfully! Redirecting to login...')\n      setTimeout(() => {\n        router.push('/login')\n      }, 1500)");

  // 8. Remove Stage wrapper inside JSX
  // We want to just unwrap `stage === 'form'` from the main block
  content = content.replace(/\{stage === 'form' && \(\s*<>/, '<>');
  content = content.replace(/<\/>\s*\)\}\s*\{\/\* ── STAGE: otp ── \*\/\}[\s\S]*?\{\s*stage === 'form' && \(/, '');
  content = content.replace(/<p style=\{\{\s*textAlign: 'center',\s*marginTop: '1\.5rem'[\s\S]*?\)\}/, "<p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--color-text-dim)', fontSize: '0.95rem' }}>\n            Already have an account? <Link href=\"/login\" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>\n          </p>");

  // Remove Stepper from register
  content = content.replace(/<div style=\{\{\s*display: 'flex',\s*justifyContent: 'center',\s*gap: '0\.5rem',\s*marginBottom: '2rem'\s*\}\}>[\s\S]*?<\/div>\r?\n/g, "");
  
  // Clean error msg block
  content = content.replace(/\{!error && !successMsg && stage === 'form' && \(/g, "{!error && !successMsg && (");
  
  // Replace Icons & texts
  content = content.replace(/<Icon name=\{stage === 'otp' \? 'mark_email_read' : 'person_add'\} size=\{24\} \/>/g, '<Icon name="person_add" size={24} />');
  content = content.replace(/\{stage === 'otp' \? 'Verify Your Email' : 'Create Account'\}/g, "'Create Account'");
  content = content.replace(/\{stage === 'otp'\s*\?\s*<p[\s\S]*?<\/p>\s*:\s*(<p[\s\S]*?<\/p>)\s*\}/g, "$1");

  fs.writeFileSync('app/register/page.tsx', content);
}

cleanLogin();
cleanRegister();
