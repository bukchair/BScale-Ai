/**
 * Firebase Admin — used only on the server for email/password signup and Firestore user docs.
 * Requires env FIREBASE_SERVICE_ACCOUNT_JSON (full JSON string of the service account key).
 */
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import type { ServiceAccount } from 'firebase-admin/app';
import firebaseConfig from '../../../firebase-applet-config.json';

let app: App | undefined;

export function getFirebaseAdminApp(): App {
  if (app) return app;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON is not set. Add the Firebase service account JSON string in the deployment environment.'
    );
  }
  const parsed = JSON.parse(raw) as ServiceAccount;
  if (getApps().length > 0) {
    app = getApps()[0]!;
    return app;
  }
  app = initializeApp({ credential: cert(parsed) });
  return app;
}

export function getFirebaseAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminDb(): Firestore {
  const a = getFirebaseAdminApp();
  const dbId = firebaseConfig.firestoreDatabaseId?.trim();
  if (dbId) return getFirestore(a, dbId);
  return getFirestore(a);
}
