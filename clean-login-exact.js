const fs = require('fs');

let lines = fs.readFileSync('app/login/page.tsx', 'utf8').split('\n');
const toRemove = [];
for (let i = 13; i <= 71; i++) toRemove.push(i); // OtpInput helper
toRemove.push(90, 99, 100, 101); // verifiedEmail, OTP digits, cooldown
for (let i = 118; i <= 124; i++) toRemove.push(i); // OTP query param check
for (let i = 127; i <= 132; i++) toRemove.push(i); // Cooldown effect
toRemove.push(140, 141, 146, 147); // resetAll OTP lines, otpString derived
for (let i = 199; i <= 205; i++) toRemove.push(i); // OTP redirect in handlePasswordLogin
for (let i = 245; i <= 288; i++) toRemove.push(i); // handleResendOtp & handleVerifyOtp
for (let i = 363; i <= 381; i++) toRemove.push(i); // Progress indicator
for (let i = 659; i <= 721; i++) toRemove.push(i); // STAGE: otp

let newLines = lines.filter((_, idx) => !toRemove.includes(idx));
let content = newLines.join('\n');
content = content.replace(/type Stage = 'role-select' \| 'password' \| 'set-password' \| 'otp'/, "type Stage = 'role-select' | 'password' | 'set-password'");
content = content.replace(/import React, \{ useState, useEffect, useRef, useCallback \} from 'react'/, "import React, { useState, useEffect, useRef } from 'react'");
content = content.replace(/      : 'Verify Your Email'/, "");
content = content.replace(/      : `\$\{selectedRole === 'CANDIDATE' \? 'Candidate' : 'Interviewer'\} — Step 2 of 2`/, "");
content = content.replace(/      \? 'Set Your Password'\r?\n\r?\n/, "      ? 'Set Your Password'\n      : ''\n\n");
content = content.replace(/      \? 'Your account needs a password before you can sign in'\r?\n\r?\n/, "      ? 'Your account needs a password before you can sign in'\n      : ''\n\n");

fs.writeFileSync('app/login/page.tsx', content);
console.log('Login fixed.');
