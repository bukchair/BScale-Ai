import type { IncomingMessage, ServerResponse } from 'http';
import axios from 'axios';

export default async function handler(req: IncomingMessage & { query: any; headers: any }, res: ServerResponse) {
  const method = req.method || 'GET';
  if (method !== 'GET') {
    res.statusCode = 405;
    res.end('Method not allowed');
    return;
  }

  const authCode = (req as any).query?.auth_code as string | undefined;

  if (!authCode) {
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
    const response = await axios.post('https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/', {
      app_id: process.env.TIKTOK_APP_ID,
      secret: process.env.TIKTOK_SECRET,
      auth_code: authCode,
    });

    const data = response.data;

    if (data.code !== 0) {
      throw new Error(data.message || 'Failed to exchange token');
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS', 
                platform: 'tiktok',
                data: ${JSON.stringify(data.data)}
              }, '*');
              window.close();
            }
          </script>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('TikTok Auth Error:', error.response?.data || error.message);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: 'Failed to authenticate with TikTok' }, '*');
              window.close();
            }
          </script>
        </body>
      </html>
    `);
  }
}

