const fs = require('fs');

function cleanFile() {
  let c = fs.readFileSync('app/register/page.tsx', 'utf8');

  // Remove types & state
  c = c.replace(/type RegStage = 'form' \| 'otp'\r?\n/, '');
  c = c.replace(/  \/\/ OTP stage\r?\n  const \[stage, setStage\] = useState<RegStage>\('form'\)\r?\n  const \[otpDigits, setOtpDigits\] = useState\(\['', '', '', '', '', ''\]\)\r?\n/, '');
  c = c.replace(/  const otpString = otpDigits.join\(''\)\r?\n/, '');

  // Remove Verify Otp function
  c = c.replace(/  \/\/ ── Verify OTP ──[\s\S]*?\/\/ ── END ──\r?\n/, '');

  // Clean JSX
  c = c.replace(/<Icon name=\{stage === 'otp' \? 'mark_email_read' : 'person_add'\} size=\{24\} \/>/, '<Icon name="person_add" size={24} />');
  c = c.replace(/\{stage === 'otp' \? 'Verify Your Email' : 'Create Account'\}/, 'Create Account');
  
  c = c.replace(/\{stage === 'otp'[\s\S]*?'Join us as a Candidate or Interviewer'\}/, "'Join us as a Candidate or Interviewer'");

  // Remove stepper UI completely and just replace it with a simple instruction paragraph
  const stepperRegex = /<div style=\{\{\s*display: 'flex',\s*justifyContent: 'center',\s*gap: '0\.5rem',\s*marginBottom: '2rem'\s*\}\}>[\s\S]*?<\/div>/;
  c = c.replace(stepperRegex, '');

  const errorSuccessRegex = /\{!error && !successMsg && stage === 'form' && \([\s\S]*?<\/p>\r?\n\s*\)\}/;
  c = c.replace(errorSuccessRegex, '{!error && !successMsg && <p style={{ color: "var(--color-text-dim)", fontSize: "0.95rem", textAlign: "center", marginBottom: "2rem" }}>Please fill in your details to create an account.</p>}');

  // Remove stage === 'form' wrapper
  c = c.replace(/\{\s*stage === 'form' && \(\s*<>/, '<>');
  
  // Remove OTP form block completely
  const otpBlockRegex = /<\/>\s*\)\}\s*\{\/\* ── STAGE: otp ── \*\/\}[\s\S]*?\{\s*stage === 'form' && \(/;
  c = c.replace(otpBlockRegex, '');
  
  // Fix the final dangling `)}` for the form block wrapper
  c = c.replace(/<p style=\{\{\s*textAlign: 'center',\s*marginTop: '1\.5rem'[\s\S]*?\)\}/, "<p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--color-text-dim)', fontSize: '0.95rem' }}>\n            Already have an account? <Link href=\"/login\" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>\n          </p>");

  fs.writeFileSync('app/register/page.tsx', c);
  console.log('Register page cleaned');
}

cleanFile();
