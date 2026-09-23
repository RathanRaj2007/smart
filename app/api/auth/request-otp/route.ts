import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateSecureOtp, hashOtp, OTP_COOLDOWN_SECONDS } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/mail';
import { createAuditLog } from '@/lib/audit-log';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Security check: Admin OTP login is strictly forbidden
    if (role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin accounts must authenticate using username and password.' },
        { status: 403 }
      );
    }

    if (role !== 'CANDIDATE' && role !== 'INTERVIEWER') {
      return NextResponse.json({ error: 'Invalid role specified.' }, { status: 400 });
    }

    // Rate Limiting: Check cooldown (60 seconds)
    const recentOtp = await prisma.otpVerification.findFirst({
      where: {
        email: normalizedEmail,
        createdAt: { gt: new Date(Date.now() - OTP_COOLDOWN_SECONDS * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentOtp) {
      const remainingSeconds = Math.ceil(
        (recentOtp.createdAt.getTime() + OTP_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000
      );
      return NextResponse.json(
        { error: `Please wait ${Math.max(remainingSeconds, 1)} seconds before requesting another code.` },
        { status: 429 }
      );
    }

    // Rate Limiting: Max 5 requests per hour per email
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourlyCount = await prisma.otpVerification.count({
      where: {
        email: normalizedEmail,
        createdAt: { gt: oneHourAgo },
      },
    });

    if (hourlyCount >= 5) {
      return NextResponse.json(
        { error: 'Too many OTP requests for this email. Please try again in an hour.' },
        { status: 429 }
      );
    }

    // Lookup user by email or username, or candidate profile
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { username: normalizedEmail },
          { candidate: { email: normalizedEmail } },
        ],
      },
      include: { candidate: true },
    });

    // If user does not exist or role doesn't match, return generic success to avoid enumeration
    if (!user || user.role !== role) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[request-otp] No active ${role} user matched email: "${normalizedEmail}"`);
      }
      return NextResponse.json({
        success: true,
        message: 'If an account is associated with this email, a verification code has been sent.',
      });
    }

    // Invalidate any previous unused OTPs for this email
    await prisma.otpVerification.updateMany({
      where: { email: normalizedEmail, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Generate, hash, and store OTP
    const otp = generateSecureOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.otpVerification.create({
      data: {
        userId: user.id,
        email: normalizedEmail,
        otpHash,
        expiresAt,
        attempts: 0,
      },
    });

    // Send email (via SMTP or dev console mock)
    await sendOtpEmail({
      email: normalizedEmail,
      otp,
      role: user.role as 'CANDIDATE' | 'INTERVIEWER',
    });

    // Audit log request
    const auditAction = role === 'CANDIDATE' ? 'CANDIDATE_OTP_REQUESTED' : 'INTERVIEWER_OTP_REQUESTED';
    createAuditLog({
      userId: user.id,
      username: user.username,
      action: auditAction,
      status: 'SUCCESS',
      metadata: { email: normalizedEmail },
    });

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email.',
    });
  } catch (err) {
    console.error('request-otp error:', err);
    return NextResponse.json({ error: 'Failed to process OTP request.' }, { status: 500 });
  }
}
