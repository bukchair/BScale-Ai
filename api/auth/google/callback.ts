import type { IncomingMessage, ServerResponse } from 'http';
import axios from 'axios';

export default async function handler(req: IncomingMessage & { query: any; headers: any }, res: ServerResponse) {
  const method = req.method || 'GET';
  if (method !== 'GET') {
    res.statusCode = 405;
    res.end('Method not allowed');
    return;
  }

  const code = (req as any).query?.code as string | undefined;

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${proto}://${host}/api/auth/google/callback`;

  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code,
    });

    const data = response.data;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS', 
                platform: 'google',
                tokens: ${JSON.stringify(data)} 
              }, '*');
              window.close();
            }
          </script>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Google Auth Error:', error.response?.data || error.message);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'google', error: 'Failed to authenticate with Google' }, '*');
              window.close();
            }
          </script>
        </body>
      </html>
    `);
  }
}

