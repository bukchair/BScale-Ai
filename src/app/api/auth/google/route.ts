import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { integrationsEnv } from '@/src/lib/env/integrations-env';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const STATE_COOKIE = 'google_auth_state';
const STATE_MAX_AGE = 60 * 10; // 10 minutes

export async function GET() {
  const state = randomBytes(24).toString('hex');

  const params = new URLSearchParams({
    client_id: integrationsEnv.GOOGLE_AUTH_CLIENT_ID,
    redirect_uri: integrationsEnv.GOOGLE_AUTH_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });

  const redirectUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: STATE_MAX_AGE,
  });

  return response;
}
