const fs = require('fs');

function cleanFile(file) {
  let lines = fs.readFileSync(file, 'utf8').split('\n');
  
  // Exclude everything between OTP start and Sign-in link / Forgot password
  const otpStart = lines.findIndex(l => l.includes('STAGE: otp'));
  const signinStart = lines.findIndex(l => l.includes('Sign-in link') || l.includes('Forgot Password'));
  
  if (otpStart !== -1 && signinStart !== -1) {
    lines = [...lines.slice(0, otpStart), ...lines.slice(signinStart)];
  }

  let c = lines.join('\n');

  // Clean React unused imports
  c = c.replace(/import React, \{ useState, useRef, useCallback, useEffect \} from 'react'/, "import React, { useState, useRef } from 'react'");
  c = c.replace(/import React, \{ useState, useEffect, useCallback \} from 'react'/, "import React, { useState } from 'react'");

  // Clean Types
  c = c.replace(/type RegStage = 'form' \| 'otp'\r?\n/, "");
  c = c.replace(/type LoginStage = 'form' \| 'otp'\r?\n/, "");

  // Clean State
  c = c.replace(/  \/\/ OTP stage\r?\n  const \[stage, setStage\] = useState<.*?stage === 'form'.*?\n/g, "");
  c = c.replace(/  const \[registeredEmail.*?\n/g, "");
  c = c.replace(/  const \[verifiedEmail.*?\n/g, "");
  c = c.replace(/  const \[otpDigits.*?\n/g, "");
  c = c.replace(/  const \[resendCooldown.*?\n/g, "");
  c = c.replace(/  const otpString.*?\n/g, "");

  // Clean useEffect
  c = c.replace(/  \/\/ Cooldown timer[\s\S]*?\[resendCooldown\]\)\r?\n\r?\n/, "");

  // Clean Functions
  c = c.replace(/  \/\/ ── Resend OTP ──[\s\S]*?isLoading\]\)\r?\n/, "");
  c = c.replace(/  \/\/ ── Verify OTP ──[\s\S]*?\/\/ ── END ──\r?\n/g, "");
  c = c.replace(/  \/\/ ── Verify OTP ──[\s\S]*?\/\/ ── Forgot Password ──\r?\n/, "// ── Forgot Password ──\n");

  // Clean Login redirects
  c = c.replace(/      if \(data.otpRequired\) \{[\s\S]*?\} else if \(data.redirect\) \{/g, "      if (data.redirect) {");
  
  // Clean Register redirects
  c = c.replace(/      \/\/ Transition to OTP step in-page[\s\S]*?setOtpDigits\(\['', '', '', '', '', ''\]\)/, "      // Redirect to login page\n      setSuccessMsg(data.message || 'Account created successfully! Redirecting to login...')\n      setTimeout(() => {\n        router.push('/login')\n      }, 1500)");

  // Remove `stage === 'form' && (` wrapping
  c = c.replace(/\{stage === 'form' && \(\s*<>/g, '<>');
  c = c.replace(/<\/>\s*\)\}\r?\n\s*$/gm, '');
  
  // For login wrapper and register wrapper
  c = c.replace(/\{stage === 'form' && \(\r?\n\s*(<div style=\{\{ marginTop: '1.75rem')/g, "$1");
  c = c.replace(/<\/Link>\r?\n\s*<\/div>\r?\n\s*\)\}/g, "</Link>\n            </div>");

  c = c.replace(/\{stage === 'form' && \(\r?\n\s*(<div style=\{\{ display: 'flex', flexDirection: 'column')/g, "$1");
  c = c.replace(/<Icon name=\{stage === 'otp' \? 'mark_email_read' : 'person_add'\} size=\{24\} \/>/, "<Icon name=\"person_add\" size={24} />");
  c = c.replace(/<Icon name=\{stage === 'otp' \? 'mark_email_read' : 'login'\} size=\{24\} \/>/, "<Icon name=\"login\" size={24} />");
  
  c = c.replace(/\{stage === 'otp' \? 'Verify Your Email' : 'Create Account'\}/, "'Create Account'");
  c = c.replace(/\{stage === 'otp' \? 'Verify Your Email' : 'Welcome Back'\}/, "'Welcome Back'");

  c = c.replace(/\{stage === 'otp'\r?\n\s*\?\s*<p[\s\S]*?<\/p>\r?\n\s*:\s*(<p[\s\S]*?<\/p>)\r?\n\s*\}/g, "$1");
  
  c = c.replace(/\{!error && !successMsg && stage === 'form' && \(/g, "{!error && !successMsg && (");

  // Remove stepper
  c = c.replace(/          <div style=\{\{\r?\n\s*display: 'flex',\r?\n\s*justifyContent: 'center',\r?\n\s*gap: '0.5rem',\r?\n\s*marginBottom: '2rem'\r?\n\s*\}\}>[\s\S]*?          <\/div>/, "");

  fs.writeFileSync(file, c);
}

cleanFile('app/register/page.tsx');
cleanFile('app/login/page.tsx');
