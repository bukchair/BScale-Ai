import { NextResponse } from 'next/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import firebaseConfig from '@/firebase-applet-config.json';
import {
  issueSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/src/lib/auth/session';

const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
const FIREBASE_ISSUER = FIREBASE_PROJECT_ID
  ? `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`
  : '';
const firebaseJwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

type BootstrapBody = {
  idToken?: string;
};

export async function POST(request: Request) {
  if (!FIREBASE_PROJECT_ID) {
    return NextResponse.json(
      {
        success: false,
        errorCode: 'CONFIGURATION_ERROR',
        message: 'Firebase project configuration is missing.',
      },
      { status: 500 }
    );
  }

  let body: BootstrapBody;
  try {
    body = (await request.json()) as BootstrapBody;
  } catch {
    return NextResponse.json(
      {
        success: false,
        errorCode: 'VALIDATION_ERROR',
        message: 'Invalid request payload.',
      },
      { status: 400 }
    );
  }

  if (!body.idToken) {
    return NextResponse.json(
      {
        success: false,
        errorCode: 'VALIDATION_ERROR',
        message: 'Missing Firebase ID token.',
      },
      { status: 400 }
    );
  }

  try {
    const { payload } = await jwtVerify(body.idToken, firebaseJwks, {
      issuer: FIREBASE_ISSUER,
      audience: FIREBASE_PROJECT_ID,
      algorithms: ['RS256'],
    });

    const uid = typeof payload.sub === 'string' ? payload.sub : '';
    const email = typeof payload.email === 'string' ? payload.email : '';
    const name =
      typeof payload.name === 'string' && payload.name.trim().length > 0 ? payload.name.trim() : null;

    if (!uid || !email) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'UNAUTHORIZED',
          message: 'Firebase token is missing required claims.',
        },
        { status: 401 }
      );
    }

    const sessionToken = await issueSessionToken({ id: uid, email, name });
    const response = NextResponse.json({
      success: true,
      message: 'Session bootstrapped.',
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch {
    return NextResponse.json(
      {
        success: false,
        errorCode: 'UNAUTHORIZED',
        message: 'Invalid Firebase ID token.',
      },
      { status: 401 }
    );
  }
}
