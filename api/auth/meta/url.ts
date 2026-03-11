import type { IncomingMessage, ServerResponse } from 'http';

export default function handler(req: IncomingMessage & { headers: any }, res: ServerResponse) {
  const method = req.method || 'GET';
  if (method !== 'GET') {
    res.statusCode = 405;
    res.end('Method not allowed');
    return;
  }

  const appId = process.env.META_APP_ID;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const redirectUri = process.env.META_REDIRECT_URI || `${proto}://${host}/api/auth/meta/callback`;

  if (!appId) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Meta App ID not configured' }));
    return;
  }

  const scope = 'ads_management,ads_read,business_management,public_profile';
  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
    redirectUri,
  )}&scope=${scope}&response_type=code`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ url: authUrl }));
}

