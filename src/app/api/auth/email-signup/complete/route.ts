import { NextResponse } from 'next/server';
import { z } from 'zod';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { prisma } from '@/src/lib/db/prisma';
import { rateLimit } from '@/src/lib/rate-limit';
import { hashSignupToken } from '@/src/lib/auth/email-signup-server';

export const dynamic = 'force-dynamic';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

const bodySchema = z.object({
  token: z.string().min(32).max(128),
  password: z.string().min(8).max(128),
});

const completeBucket = { limit: 15, windowMs: 60 * 60 * 1000 };

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = rateLimit(`email-signup-complete:${ip}`, completeBucket);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, message: 'Too many attempts. Please try again later.' },
      { status: 429 }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: 'Password must be at least 8 characters.' },
      { status: 400 }
    );
  }

  const tokenHash = hashSignupToken(parsed.data.token);

  const invite = await prisma.emailSignupInvite.findUnique({
    where: { tokenHash },
  });

  if (!invite || invite.usedAt || invite.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json(
      { success: false, message: 'This link is invalid or has expired. Request a new signup email.' },
      { status: 400 }
    );
  }

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existing) {
    await prisma.emailSignupInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });
    return NextResponse.json(
      { success: false, message: 'This email is already registered. Sign in with email and password.' },
      { status: 409 }
    );
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password);

    await prisma.user.create({
      data: {
        email: invite.email,
        name: invite.name?.trim() || null,
        passwordHash,
        role: 'user',
      },
    });

    await prisma.emailSignupInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Account created. You can sign in.',
      email: invite.email,
    });
  } catch (err) {
    console.error('[email-signup/complete]', err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : 'Could not complete registration.',
      },
      { status: 500 }
    );
  }
}
