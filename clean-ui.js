const fs = require('fs');

function cleanRegister() {
  let c = fs.readFileSync('app/register/page.tsx', 'utf8');

  // Imports
  c = c.replace(/import React, \{ useState, useRef, useCallback, useEffect \} from 'react'/, "import React, { useState, useRef } from 'react'");

  // Types
  c = c.replace(/type RegStage = 'form' \| 'otp'\n/, "");

  // State
  c = c.replace(/  \/\/ OTP stage\n  const \[stage, setStage\] = useState<RegStage>\('form'\)\n  const \[registeredEmail, setRegisteredEmail\] = useState\(''\)\n  const \[otpDigits, setOtpDigits\] = useState\(\['', '', '', '', '', ''\]\)\n  const \[resendCooldown, setResendCooldown\] = useState\(0\)\n/, "");
  c = c.replace(/  const otpString = otpDigits.join\(''\)\n\n  \/\/ Cooldown timer\n  useEffect\(\(\) => \{\n    if \(resendCooldown <= 0\) return\n    const t = setInterval\(\(\) => setResendCooldown\(\(p\) => p - 1\), 1000\)\n    return \(\) => clearInterval\(t\)\n  \}, \[resendCooldown\]\)\n/, "");

  // Functions
  c = c.replace(/  \/\/ ── Resend OTP ──[\s\S]*?isLoading\]\)\n\n/, "");
  c = c.replace(/  \/\/ ── Verify OTP ──[\s\S]*?\/\/ ── END ──\n\n/, "");
  c = c.replace(/setRegisteredEmail\(data.email \|\| trimmedEmail\)\n      setStage\('otp'\)\n      setResendCooldown\(60\)\n      setSuccessMsg\(data.message \|\| 'Account created! Check your email for the verification code.'\)\n      setOtpDigits\(\['', '', '', '', '', ''\]\)/, "setSuccessMsg(data.message || 'Account created successfully! Redirecting to login...')\n      setTimeout(() => {\n        router.push('/login')\n      }, 1500)");

  // Stepper UI
  c = c.replace(/          <div style=\{\{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' \}\}>[\s\S]*?          <\/div>/, "");
  
  // Icon and Title
  c = c.replace(/<Icon name=\{stage === 'otp' \? 'mark_email_read' : 'person_add'\} size=\{24\} \/>/, "<Icon name=\"person_add\" size={24} />");
  c = c.replace(/\{stage === 'otp' \? 'Verify Your Email' : 'Create Account'\}/, "Create Account");
  c = c.replace(/\{stage === 'otp'\s*\?\s*<p style=\{\{ color: 'var\(--color-text-dim\)', fontSize: '0.95rem', marginTop: '0.5rem' \}\}>[\s\S]*?<\/p>\s*:\s*(<p style=\{\{ color: 'var\(--color-text-dim\)', fontSize: '0.95rem', marginTop: '0.5rem' \}\}>[\s\S]*?<\/p>)\s*\}/, "$1");

  // error && successMsg wrapper
  c = c.replace(/\{!error && !successMsg && stage === 'form' && \(/, "{!error && !successMsg && (");

  // form block wrapper
  c = c.replace(/          \{stage === 'form' && \(/, "");
  c = c.replace(/          \{stage === 'form' && \(\s*(<div style=\{\{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.85rem', color: 'var\(--color-text-muted\)' \}\}>)/, "$1");
  c = c.replace(/          \)\}\s*\{\/\* ── STAGE: otp ── \*\/\}[\s\S]*?\)\}/, "");

  fs.writeFileSync('app/register/page.tsx', c);
  console.log("Register page cleaned.");
}

function cleanLogin() {
  let c = fs.readFileSync('app/login/page.tsx', 'utf8');

  // Imports
  c = c.replace(/import React, \{ useState, useEffect, useCallback \} from 'react'/, "import React, { useState } from 'react'");

  // Types
  c = c.replace(/type LoginStage = 'form' \| 'otp'\n/, "");

  // State
  c = c.replace(/  \/\/ OTP stage\n  const \[stage, setStage\] = useState<LoginStage>\('form'\)\n  const \[verifiedEmail, setVerifiedEmail\] = useState\(''\)\n  const \[otpDigits, setOtpDigits\] = useState\(\['', '', '', '', '', ''\]\)\n  const \[resendCooldown, setResendCooldown\] = useState\(0\)\n\n  const otpString = otpDigits.join\(''\)\n/, "");
  c = c.replace(/  \/\/ Cooldown timer\n  useEffect\(\(\) => \{\n    if \(resendCooldown <= 0\) return\n    const t = setInterval\(\(\) => setResendCooldown\(\(p\) => p - 1\), 1000\)\n    return \(\) => clearInterval\(t\)\n  \}, \[resendCooldown\]\)\n/, "");

  // Functions
  c = c.replace(/  \/\/ ── Resend OTP ──[\s\S]*?isLoading\]\)\n/, "");
  c = c.replace(/  \/\/ ── Verify OTP ──[\s\S]*?\/\/ ── Forgot Password ──\n/g, "// ── Forgot Password ──\n");
  
  c = c.replace(/      if \(data.otpRequired\) \{\n        setVerifiedEmail\(data.email\)\n        setStage\('otp'\)\n        setResendCooldown\(60\)\n        setSuccessMsg\(data.message \|\| 'Check your email for the verification code.'\)\n        setOtpDigits\(\['', '', '', '', '', ''\]\)\n      \} else if \(data.redirect\) \{/, "      if (data.redirect) {");
  
  // Icon and Title
  c = c.replace(/<Icon name=\{stage === 'otp' \? 'mark_email_read' : 'login'\} size=\{24\} \/>/, "<Icon name=\"login\" size={24} />");
  c = c.replace(/\{stage === 'otp' \? 'Verify Your Email' : 'Welcome Back'\}/, "Welcome Back");
  c = c.replace(/\{stage === 'otp'[\s\S]*?<\/p>\s*:\s*(<p style=\{\{ color: 'var\(--color-text-dim\)', fontSize: '0.95rem', marginTop: '0.5rem' \}\}>[\s\S]*?<\/p>)\s*\}/, "$1");

  // form block wrapper
  c = c.replace(/          \{stage === 'form' && \(/, "");
  c = c.replace(/          \{stage === 'form' && \(\s*(<div style=\{\{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.85rem', color: 'var\(--color-text-muted\)' \}\}>)/, "$1");
  c = c.replace(/          \)\}\s*\{\/\* ── STAGE: otp ── \*\/\}[\s\S]*?\)\}/, "");

  fs.writeFileSync('app/login/page.tsx', c);
  console.log("Login page cleaned.");
}

cleanRegister();
cleanLogin();
