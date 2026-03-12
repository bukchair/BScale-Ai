/**
 * Vercel Serverless: GET /api/auth/google/callback
 * Exchanges OAuth code for tokens and posts to opener. Requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI in Vercel env.
 */

const HTML_SUCCESS = (tokens: object) => `
<!DOCTYPE html>
<html><body>
<script>
if (window.opener) {
  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', platform: 'google', tokens: ${JSON.stringify(tokens)} }, '*');
  window.close();
}
</script>
<p>Success. You can close this window.</p>
</body></html>
`;

const HTML_ERROR = (err: string) => `
<!DOCTYPE html>
<html><body>
<script>
if (window.opener) {
  window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'google', error: ${JSON.stringify(err)} }, '*');
  window.close();
}
</script>
<p>Error. You can close this window.</p>
</body></html>
`;

export default async function handler(
  req: { method?: string; query?: { code?: string } },
  res: { status: (n: number) => { send: (s: string) => void }; send: (s: string) => void }
) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  const code = req.query?.code;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!code) {
    return res.status(200).send(HTML_ERROR('No auth code provided'));
  }
  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(200).send(HTML_ERROR('Google OAuth not configured'));
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code: String(code),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error_description || data.error || 'Token exchange failed');
    }
    return res.status(200).send(HTML_SUCCESS(data));
  } catch (e: unknown) {
    const err = e instanceof Error ? e.message : 'Failed to authenticate with Google';
    return res.status(200).send(HTML_ERROR(err));
  }
}
