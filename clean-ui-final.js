const fs = require('fs');

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Remove specific React imports
  content = content.replace(/, useCallback/g, '');
  content = content.replace(/useCallback, /g, '');

  // 2. Remove Type Definitions
  content = content.replace(/type RegStage = 'form' \| 'otp'\r?\n/, '');
  content = content.replace(/type LoginStage = 'form' \| 'otp'\r?\n/, '');

  // 3. Remove State Declarations
  const statesToRemove = [
    "const [stage, setStage] = useState",
    "const [registeredEmail",
    "const [verifiedEmail",
    "const [otpDigits",
    "const [resendCooldown",
    "const otpString ="
  ];
  const lines = content.split('\n');
  const filteredLines = lines.filter(line => !statesToRemove.some(s => line.includes(s)));
  
  // 4. Remove useEffect for Cooldown
  const cooldownIndex = filteredLines.findIndex(l => l.includes('// Cooldown timer'));
  if (cooldownIndex !== -1) {
    let endIndex = cooldownIndex;
    while (!filteredLines[endIndex].includes('}, [resendCooldown])')) endIndex++;
    filteredLines.splice(cooldownIndex, endIndex - cooldownIndex + 1);
  }

  // 5. Remove Resend OTP Function
  const resendIndex = filteredLines.findIndex(l => l.includes('// ── Resend OTP ──'));
  if (resendIndex !== -1) {
    let endIndex = resendIndex;
    while (!filteredLines[endIndex].includes('isLoading])')) endIndex++;
    filteredLines.splice(resendIndex, endIndex - resendIndex + 1);
  }

  // 6. Remove Verify OTP Function
  const verifyIndex = filteredLines.findIndex(l => l.includes('// ── Verify OTP ──'));
  if (verifyIndex !== -1) {
    let endIndex = verifyIndex;
    while (!filteredLines[endIndex].includes('// ──') && endIndex < filteredLines.length - 1) {
      if (filteredLines[endIndex+1].includes('// ── Forgot Password ──') || filteredLines[endIndex+1].includes('// ── END ──')) break;
      endIndex++;
    }
    filteredLines.splice(verifyIndex, endIndex - verifyIndex + 1);
  }

  content = filteredLines.join('\n');

  // 7. Fix redirect in handleRegister (Register page)
  const otpTransition = /setRegisteredEmail\([\s\S]*?setOtpDigits\(\['', '', '', '', '', ''\]\)/;
  content = content.replace(otpTransition, "setTimeout(() => {\n        router.push('/login')\n      }, 1500)");

  // 8. Fix redirect in handleLogin (Login page)
  const loginOtpTransition = /if \(data\.otpRequired\) \{[\s\S]*?\} else if \(data\.redirect\) \{/g;
  content = content.replace(loginOtpTransition, "if (data.redirect) {");

  // 9. Fix JSX (Remove Stage wrappers and Stepper)
  content = content.replace(/\{stage === 'form' && \(\s*<>/g, '<>');
  content = content.replace(/\{stage === 'form' && \(\r?\n\s*(<div style=\{\{ marginTop: '1.75rem')/g, "$1");
  content = content.replace(/\{stage === 'form' && \(\r?\n\s*(<div style=\{\{ display: 'flex', flexDirection: 'column')/g, "$1");
  content = content.replace(/\{!error && !successMsg && stage === 'form' && \(/g, "{!error && !successMsg && (");
  
  content = content.replace(/<Icon name=\{stage === 'otp' \? 'mark_email_read' : 'person_add'\} size=\{24\} \/>/g, '<Icon name="person_add" size={24} />');
  content = content.replace(/<Icon name=\{stage === 'otp' \? 'mark_email_read' : 'login'\} size=\{24\} \/>/g, '<Icon name="login" size={24} />');
  
  content = content.replace(/\{stage === 'otp' \? 'Verify Your Email' : 'Create Account'\}/g, "'Create Account'");
  content = content.replace(/\{stage === 'otp' \? 'Verify Your Email' : 'Welcome Back'\}/g, "'Welcome Back'");
  
  content = content.replace(/\{stage === 'otp'\r?\n\s*\?\s*<p[\s\S]*?<\/p>\r?\n\s*:\s*(<p[\s\S]*?<\/p>)\r?\n\s*\}/g, "$1");
  content = content.replace(/\{stage === 'otp'\s*\?\s*<p[\s\S]*?<\/p>\s*:\s*(<p[\s\S]*?<\/p>)\s*\}/g, "$1");
  
  // Remove Stepper from register
  content = content.replace(/<div style=\{\{\s*display: 'flex',\s*justifyContent: 'center',\s*gap: '0.5rem',\s*marginBottom: '2rem'\s*\}\}>[\s\S]*?<\/div>\r?\n/g, "");

  // Remove OTP block in JSX
  const otpBlockStart = content.indexOf('{/* ── STAGE: otp ── */}');
  if (otpBlockStart !== -1) {
    let nextFormStart = content.indexOf('{stage === \'form\' &&', otpBlockStart);
    if (nextFormStart === -1) nextFormStart = content.indexOf('{/* Sign-in link */}', otpBlockStart);
    if (nextFormStart === -1) nextFormStart = content.indexOf('{/* Sign-up link */}', otpBlockStart);
    
    if (nextFormStart !== -1) {
      content = content.substring(0, otpBlockStart) + content.substring(nextFormStart);
    }
  }

  // Final cleanup of lingering `)}` from the `stage === 'form' && (` that we removed earlier
  // Since we replaced the start with just the inner div, the closing `)}` will be right before `</div>` or `</Link></div>`
  content = content.replace(/<\/div>\r?\n\s*\)\}\r?\n\s*<\/div>\r?\n\s*<\/div>\r?\n\s*<\/div>\r?\n\s*\)\r?\n\}/g, "</div>\n        </div>\n      </div>\n    </div>\n  )\n}");
  
  content = content.replace(/<\/Link>\r?\n\s*<\/div>\r?\n\s*\)\}/g, "</Link>\n            </div>");

  fs.writeFileSync(filePath, content);
  console.log('Cleaned', filePath);
}

cleanFile('app/register/page.tsx');
cleanFile('app/login/page.tsx');
