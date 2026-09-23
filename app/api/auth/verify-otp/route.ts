import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyOtpHash, OTP_MAX_ATTEMPTS } from '@/lib/otp';
import { getAppSession, getServerInstanceId } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit-log';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, role, otp } = body;

    if (!email || !role || !otp) {
      return NextResponse.json({ error: 'Email, role, and verification code are required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

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

    if (!/^\d{6}$/.test(cleanOtp)) {
      return NextResponse.json({ error: 'Verification code must be a 6-digit number.' }, { status: 400 });
    }

    // Find the latest unused OTP record for this email
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        email: normalizedEmail,
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });

    if (!otpRecord) {
      const failureAction = role === 'CANDIDATE' ? 'CANDIDATE_OTP_FAILED' : 'INTERVIEWER_OTP_FAILED';
      createAuditLog({
        action: failureAction,
        status: 'FAILURE',
        metadata: { email: normalizedEmail, reason: 'No active OTP found' },
      });
      return NextResponse.json(
        { error: 'No active verification code found. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check expiration
    if (otpRecord.expiresAt < new Date()) {
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { usedAt: new Date() },
      });
      const failureAction = role === 'CANDIDATE' ? 'CANDIDATE_OTP_FAILED' : 'INTERVIEWER_OTP_FAILED';
      createAuditLog({
        userId: otpRecord.userId ?? undefined,
        action: failureAction,
        status: 'FAILURE',
        metadata: { email: normalizedEmail, reason: 'Expired OTP' },
      });
      return NextResponse.json(
        { error: 'This verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check maximum attempts
    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { usedAt: new Date() },
      });
      const failureAction = role === 'CANDIDATE' ? 'CANDIDATE_OTP_FAILED' : 'INTERVIEWER_OTP_FAILED';
      createAuditLog({
        userId: otpRecord.userId ?? undefined,
        action: failureAction,
        status: 'FAILURE',
        metadata: { email: normalizedEmail, reason: 'Max attempts exceeded' },
      });
      return NextResponse.json(
        { error: 'Too many incorrect attempts. This code has been invalidated. Please request a new code.' },
        { status: 400 }
      );
    }

    // Verify OTP hash
    const isValid = verifyOtpHash(cleanOtp, otpRecord.otpHash);

    if (!isValid) {
      const newAttempts = otpRecord.attempts + 1;
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: {
          attempts: newAttempts,
          usedAt: newAttempts >= OTP_MAX_ATTEMPTS ? new Date() : null,
        },
      });

      const failureAction = role === 'CANDIDATE' ? 'CANDIDATE_OTP_FAILED' : 'INTERVIEWER_OTP_FAILED';
      createAuditLog({
        userId: otpRecord.userId ?? undefined,
        action: failureAction,
        status: 'FAILURE',
        metadata: { email: normalizedEmail, attempts: newAttempts },
      });

      const remaining = OTP_MAX_ATTEMPTS - newAttempts;
      return NextResponse.json(
        {
          error:
            remaining > 0
              ? `Incorrect verification code. ${remaining} attempt(s) remaining.`
              : 'Too many incorrect attempts. This code has been invalidated. Please request a new code.',
        },
        { status: 400 }
      );
    }

    // OTP is valid! Invalidate immediately (single-use)
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    // Lookup user
    let user = otpRecord.user;
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: normalizedEmail },
            { username: normalizedEmail },
            { candidate: { email: normalizedEmail } },
          ],
        },
      });
    }

    if (!user || user.role !== role) {
      return NextResponse.json({ error: 'Account not authorized for this role.' }, { status: 403 });
    }

    // Ensure Candidate record exists if CANDIDATE
    if (user.role === 'CANDIDATE') {
      const existingCandidate = await prisma.candidate.findUnique({
        where: { userId: user.id },
      });
      if (!existingCandidate) {
        await prisma.candidate.create({
          data: {
            userId: user.id,
            name: user.username,
            email: normalizedEmail,
          },
        });
      }
    }

    // Establish iron-session
    const redirectUrl = user.role === 'CANDIDATE' ? '/candidate' : '/dashboard';
    const response = NextResponse.json({ success: true, redirect: redirectUrl });
    const session = await getAppSession(req as unknown as Request, response as unknown as Response);

    session.userId = user.id;
    session.username = user.username;
    session.role = user.role;
    session.instanceId = getServerInstanceId();
    session.isLoggedIn = true;
    await session.save();

    // Audit log success
    const successAction = role === 'CANDIDATE' ? 'CANDIDATE_OTP_VERIFIED' : 'INTERVIEWER_OTP_VERIFIED';
    createAuditLog({
      userId: user.id,
      username: user.username,
      action: successAction,
      status: 'SUCCESS',
      metadata: { role: user.role, email: normalizedEmail },
    });

    return response;
  } catch (err) {
    console.error('verify-otp error:', err);
    return NextResponse.json({ error: 'Failed to verify code.' }, { status: 500 });
  }
}
