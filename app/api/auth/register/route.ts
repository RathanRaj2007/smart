import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { generateSecureOtp, hashOtp } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/mail';

const PASSWORD_MIN_LENGTH = 8;

function validatePasswordStrength(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
  }
  if (!/[0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    return 'Password must contain at least one number or special character.';
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    const emailInput = (email || '').trim().toLowerCase();
    const nameInput = (name || '').trim();

    if (!emailInput || !nameInput || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    // Security check: ADMIN accounts can NEVER be created via public registration
    if (role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Administrator accounts cannot be created via public registration.' },
        { status: 403 }
      );
    }

    const assignedRole: 'CANDIDATE' | 'INTERVIEWER' =
      role === 'INTERVIEWER' ? 'INTERVIEWER' : 'CANDIDATE';

    // Validate password strength
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    // Check if an account with this email already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailInput },
          { username: emailInput },
          { candidate: { email: emailInput } },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in.' },
        { status: 409 }
      );
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with passwordHash
    const newUser = await prisma.user.create({
      data: {
        username: emailInput,
        email: emailInput,
        passwordHash,
        role: assignedRole,
      },
    });

    // Create Candidate profile if needed
    if (assignedRole === 'CANDIDATE') {
      await prisma.candidate.create({
        data: {
          userId: newUser.id,
          name: nameInput,
          email: emailInput,
        },
      });
    }

    // Generate and send initial OTP for immediate email verification
    const otp = generateSecureOtp();
    const otpHash = hashOtp(otp);

    await prisma.otpVerification.create({
      data: {
        userId: newUser.id,
        email: emailInput,
        otpHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 0,
      },
    });

    try {
      await sendOtpEmail({
        email: emailInput,
        otp,
        role: assignedRole,
      });
    } catch (mailErr) {
      console.error('Failed to send initial OTP on registration:', mailErr);
    }

    return NextResponse.json(
      {
        success: true,
        otpRequired: true,
        email: emailInput,
        role: assignedRole,
        message: 'Account created. A 6-digit verification code has been sent to your email.',
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
