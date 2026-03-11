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
  const redirectUri = process.env.META_REDIRECT_URI || `${proto}://${host}/api/auth/meta/callback`;

  if (!code) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: 'No auth code provided' }, '*');
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    return;
  }

  try {
    const response = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri: redirectUri,
        code,
      },
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
                platform: 'meta',
                data: ${JSON.stringify(data)}
              }, '*');
              window.close();
            }
          </script>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Meta Auth Error:', error.response?.data || error.message);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: 'Failed to authenticate with Meta' }, '*');
              window.close();
            }
          </script>
        </body>
      </html>
    `);
  }
}

