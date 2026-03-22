# Email signup (without Google)

## What it does

1. User chooses **Sign up**, enters name + **any** email address, and clicks **Send confirmation email**.
2. The server sends an email **from the admin’s connected Gmail** (Integrations → Gmail) with a link to `/auth/complete-email?token=…`.
3. User sets a password; the server creates a **Firebase Auth** user and a Firestore `users/{uid}` profile with **`subscriptionStatus: demo`** and **`plan: demo`**.
4. The client signs in and calls **`/api/auth/session/bootstrap`** → redirect to **`/app`** (overview).  
   When the user pays / an admin sets **active**, update `subscriptionStatus` in Firestore as you do today.

## Firebase Console

1. **Authentication → Sign-in method** → enable **Email/Password**.
2. Create a **service account** (Project settings → Service accounts) and download JSON.  
   Set **`FIREBASE_SERVICE_ACCOUNT_JSON`** to the **entire JSON as one line** in your host (Cloud Run secret, etc.).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Server-side user creation + Firestore user doc |
| `APP_BASE_URL` | Public site URL for links in emails (e.g. `https://bscale.co.il`) |
| `NEXT_PUBLIC_ADMIN_EMAIL` or `ADMIN_MAIL_SENDER_EMAIL` | Must match a **Prisma `User.email`** that has **Gmail connected** |
| `ENABLE_GMAIL_SEND_SCOPE` | Set to `true` and **reconnect Gmail** so OAuth includes `gmail.send` |

## Database

Run migrations so **`EmailSignupInvite`** exists:

```bash
npx prisma migrate deploy
```

## Admin checklist

1. Sign in to the app once as the admin so **`User`** row exists with that email.
2. Connect **Gmail** under Integrations with **send** scope enabled.
3. Deploy env vars above.

If Gmail or Firebase is misconfigured, the API returns **503** or **500** with a clear log line.
