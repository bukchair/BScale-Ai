import type { IncomingMessage, ServerResponse } from 'http';

export default function handler(req: IncomingMessage & { headers: any }, res: ServerResponse) {
  const method = req.method || 'GET';
  if (method !== 'GET') {
    res.statusCode = 405;
    res.end('Method not allowed');
    return;
  }

  const appId = process.env.TIKTOK_APP_ID;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const redirectUri = process.env.TIKTOK_REDIRECT_URI || `${proto}://${host}/api/auth/tiktok/callback`;

  if (!appId) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'TikTok App ID not configured' }));
    return;
  }

  const authUrl = `https://ads.tiktok.com/marketing_api/auth?app_id=${appId}&state=state&redirect_uri=${encodeURIComponent(
    redirectUri,
  )}`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ url: authUrl }));
}

