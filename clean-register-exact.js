const fs = require('fs');

let lines = fs.readFileSync('app/register/page.tsx', 'utf8').split('\n');
const toRemove = [];
for (let i = 8; i <= 64; i++) toRemove.push(i); // OtpInput helper
toRemove.push(66); // type RegStage
toRemove.push(84, 85, 86, 87); // OTP stage vars
toRemove.push(93); // otpString
for (let i = 96; i <= 101; i++) toRemove.push(i); // Cooldown timer
for (let i = 164; i <= 207; i++) toRemove.push(i); // handleResend & handleVerifyOtp
for (let i = 249; i <= 263; i++) toRemove.push(i); // Progress
for (let i = 406; i <= 459; i++) toRemove.push(i); // STAGE: otp

let newLines = lines.filter((_, idx) => !toRemove.includes(idx));
let content = newLines.join('\n');
content = content.replace(/import React, \{ useState, useRef, useCallback, useEffect \} from 'react'/, "import React, { useState } from 'react'");
content = content.replace(/      \/\/ Transition to OTP step in-page\r?\n      setRegisteredEmail\(data\.email \|\| trimmedEmail\)\r?\n      setStage\('otp'\)\r?\n      setResendCooldown\(60\)\r?\n      setSuccessMsg\(data\.message \|\| 'Account created! Check your email for the verification code\.'\)\r?\n      setOtpDigits\(\['', '', '', '', '', ''\]\)/, "      // Redirect to login page\n      setSuccessMsg(data.message || 'Account created successfully! Redirecting to login...')\n      setTimeout(() => {\n        router.push('/login')\n      }, 1500)");
content = content.replace(/<Icon name=\{stage === 'otp' \? 'mark_email_read' : 'person_add'\} size=\{24\} \/>/, "<Icon name=\"person_add\" size={24} />");
content = content.replace(/\{stage === 'otp' \? 'Verify Your Email' : 'Create Account'\}/, "'Create Account'");
content = content.replace(/\{stage === 'otp'\r?\n\s*\?\s*`Step 2 of 2 — \$\{role === 'CANDIDATE' \? 'Candidate' : 'Interviewer'\}`\r?\n\s*:\s*'Join SmartInterview — Step 1 of 2'\}/, "'Join SmartInterview — Create your account'");

// Remove `{stage === 'form' && (` wrappers
content = content.replace(/\{stage === 'form' && \(\s*<>/g, '<>');
content = content.replace(/\{stage === 'form' && \(\r?\n\s*(<form onSubmit)/g, "$1");
content = content.replace(/\{stage === 'form' && \(\r?\n\s*(<div style=\{\{ marginTop: '1.75rem')/g, "$1");
// The `)}` closing tags for the `stage === 'form' && (`
content = content.replace(/<\/button>\r?\n\s*<\/form>\r?\n\s*\)\}/, "</button>\n            </form>");
content = content.replace(/<\/Link>\r?\n\s*<\/div>\r?\n\s*\)\}/, "</Link>\n            </div>");

fs.writeFileSync('app/register/page.tsx', content);
console.log('Register fixed.');
