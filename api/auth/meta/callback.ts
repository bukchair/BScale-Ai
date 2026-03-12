/**
 * Vercel Serverless: GET /api/auth/meta/callback
 * Exchanges OAuth code for Meta access token. Requires META_APP_ID, META_APP_SECRET, META_REDIRECT_URI in Vercel env.
 */

const HTML_SUCCESS = (data: object) => `
<!DOCTYPE html>
<html><body>
<script>
if (window.opener) {
  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', platform: 'meta', data: ${JSON.stringify(data)} }, '*');
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
  window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: ${JSON.stringify(err)} }, '*');
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
  const redirectUri = process.env.META_REDIRECT_URI;
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!code) {
    return res.status(200).send(HTML_ERROR('No auth code provided'));
  }
  if (!appId || !appSecret || !redirectUri) {
    return res.status(200).send(HTML_ERROR('Meta OAuth not configured'));
  }

  try {
    const params = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code: String(code),
    });
    const response = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${params}`);

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error?.message || data.error_description || 'Token exchange failed');
    }
    return res.status(200).send(HTML_SUCCESS(data));
  } catch (e: unknown) {
    const err = e instanceof Error ? e.message : 'Failed to authenticate with Meta';
    return res.status(200).send(HTML_ERROR(err));
  }
}
