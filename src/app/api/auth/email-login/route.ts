import { NextResponse } from 'next/server';
import { z } from 'zod';
import { scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { prisma } from '@/src/lib/db/prisma';
import { rateLimit } from '@/src/lib/rate-limit';
import { issueSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/src/lib/auth/session';

export const dynamic = 'force-dynamic';

const scryptAsync = promisify(scrypt);

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, storedKey] = hash.split(':');
  if (!salt || !storedKey) return false;
  try {
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    const storedBuf = Buffer.from(storedKey, 'hex');
    if (derivedKey.length !== storedBuf.length) return false;
    return timingSafeEqual(derivedKey, storedBuf);
  } catch {
    return false;
  }
}

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

const loginBucket = { limit: 10, windowMs: 60 * 1000 }; // 10 attempts per minute per IP

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = rateLimit(`email-login:${ip}`, loginBucket);
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
    return NextResponse.json({ success: false, message: 'Invalid email or password.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.trim().toLowerCase() },
    select: { id: true, email: true, name: true, passwordHash: true },
  });

  const GENERIC_ERROR = 'Invalid email or password.';

  if (!user || !user.passwordHash) {
    return NextResponse.json({ success: false, message: GENERIC_ERROR }, { status: 401 });
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ success: false, message: GENERIC_ERROR }, { status: 401 });
  }

  const sessionToken = await issueSessionToken({
    id: user.id,
    email: user.email,
    name: user.name ?? null,
  });

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
