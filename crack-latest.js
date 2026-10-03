const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
require('dotenv').config();

const prisma = new PrismaClient();
const secret = process.env.SESSION_SECRET || 'smartinterview-otp-salt-fallback-32chars';

function bruteForce(targetHash) {
  for (let i = 100000; i < 1000000; i++) {
    const otp = i.toString();
    const hash = crypto.createHmac('sha256', secret).update(otp).digest('hex');
    if (hash === targetHash) return otp;
  }
  return null;
}

async function main() {
  const latestOtp = await prisma.otpVerification.findFirst({
    where: { email: 'battularathanraj6@gmail.com' },
    orderBy: { createdAt: 'desc' }
  });
  
  if (latestOtp) {
    console.log('Latest OTP for battularathanraj6@gmail.com:', bruteForce(latestOtp.otpHash));
  }
  
  const latestOtp2 = await prisma.otpVerification.findFirst({
    where: { email: 'battularathanraj@gmail.com' },
    orderBy: { createdAt: 'desc' }
  });
  
  if (latestOtp2) {
    console.log('Latest OTP for battularathanraj@gmail.com:', bruteForce(latestOtp2.otpHash));
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
