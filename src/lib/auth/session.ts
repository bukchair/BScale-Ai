import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '@/src/lib/db/prisma';
import { integrationsEnv } from '@/src/lib/env/integrations-env';
import { IntegrationError } from '@/src/lib/integrations/core/errors';

export const SESSION_COOKIE_NAME = 'saas_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type AuthenticatedUser = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
};

type SessionPayload = {
  sub: string;
  email: string;
  name?: string;
};

const getSessionSecret = () => new TextEncoder().encode(integrationsEnv.SESSION_SIGNING_SECRET);

export const issueSessionToken = async (user: Pick<AuthenticatedUser, 'id' | 'email' | 'name'>): Promise<string> => {
  return new SignJWT({
    email: user.email,
    name: user.name ?? undefined,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSessionSecret());
};

export const requireAuthenticatedUser = async (): Promise<AuthenticatedUser> => {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!rawToken) {
    throw new IntegrationError('UNAUTHORIZED', 'Missing user session.', 401);
  }

  let payload: SessionPayload;
  try {
    const { payload: verifiedPayload } = await jwtVerify(rawToken, getSessionSecret(), {
      algorithms: ['HS256'],
    });
    payload = {
      sub: String(verifiedPayload.sub || ''),
      email: String(verifiedPayload.email || ''),
      name: verifiedPayload.name ? String(verifiedPayload.name) : undefined,
    };
  } catch {
    throw new IntegrationError('UNAUTHORIZED', 'Invalid user session.', 401);
  }

  if (!payload.sub || !payload.email) {
    throw new IntegrationError('UNAUTHORIZED', 'Session payload is missing user claims.', 401);
  }

  let user = await prisma.user.findFirst({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { id: payload.sub, email: payload.email, name: payload.name ?? null },
      select: { id: true, email: true, name: true, role: true },
    });
  } else if (user.email !== payload.email || user.name !== (payload.name ?? null)) {
    // Keep email and name in sync with the JWT session on change only.
    user = await prisma.user.update({
      where: { id: payload.sub },
      data: { email: payload.email, name: payload.name ?? null },
      select: { id: true, email: true, name: true, role: true },
    });
  }

  return user;
};
