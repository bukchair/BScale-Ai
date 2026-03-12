/**
 * Vercel Serverless: POST /api/proxy/woocommerce
 * Proxies requests to WooCommerce REST API. Body: { url, key, secret, endpoint, method?, data? }
 */

async function readBody(req: { method?: string; body?: unknown; on?: (e: string, c: (chunk: Buffer) => void) => void; [key: string]: unknown }): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object') {
    return req.body as Record<string, unknown>;
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on?.('data', (chunk: Buffer) => chunks.push(chunk));
    req.on?.('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on?.('error', reject);
  });
}

async function tryFetch(
  targetUrl: string,
  key: string,
  secret: string,
  method: string,
  bodyData?: unknown
): Promise<Response> {
  const urlObj = new URL(targetUrl);
  urlObj.searchParams.append('consumer_key', key);
  urlObj.searchParams.append('consumer_secret', secret);

  const auth = Buffer.from(`${key}:${secret}`).toString('base64');
  const headers: Record<string, string> = {
    Authorization: `Basic ${auth}`,
    'User-Agent': 'Mozilla/5.0 (compatible; BScale/1.0)',
    Accept: 'application/json',
  };
  if (method === 'PUT' || method === 'POST') {
    headers['Content-Type'] = 'application/json';
  }

  const options: RequestInit = { method, headers, redirect: 'follow' };
  if ((method === 'PUT' || method === 'POST') && bodyData !== undefined) {
    options.body = JSON.stringify(bodyData);
  }
  return fetch(urlObj.toString(), options);
}

export default async function handler(
  req: { method?: string; on?: (e: string, c: (chunk: Buffer) => void) => void; [key: string]: unknown },
  res: { status: (n: number) => { json: (o: object) => void }; setHeader: (k: string, v: string) => void; json: (o: object) => void }
) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let body: { url?: string; key?: string; secret?: string; endpoint?: string; method?: string; data?: unknown };
  try {
    body = (await readBody(req)) as typeof body;
  } catch {
    return res.status(400).json({ message: 'Invalid JSON body' });
  }

  const { url, key, secret, endpoint, method = 'GET', data } = body;
  if (!url || !key || !secret) {
    return res.status(400).json({ message: 'Missing credentials' });
  }

  try {
    let formattedUrl = String(url).trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }
    const baseUrl = formattedUrl.endsWith('/') ? formattedUrl.slice(0, -1) : formattedUrl;
    const endpointPath = endpoint || 'system_status';

    let apiUrl = `${baseUrl}/wp-json/wc/v3/${endpointPath}`;
    let response = await tryFetch(apiUrl, key, secret, method, data);

    if (response.status === 405 || response.status === 404) {
      apiUrl = `${baseUrl}/index.php/wp-json/wc/v3/${endpointPath}`;
      response = await tryFetch(apiUrl, key, secret, method, data);
    }
    if (response.status === 405 || response.status === 404) {
      apiUrl = `${baseUrl}/wc-api/v3/${endpointPath}`;
      response = await tryFetch(apiUrl, key, secret, method, data);
    }

    const text = await response.text();
    let dataOut: unknown;
    if (text) {
      try {
        dataOut = JSON.parse(text);
      } catch {
        return res.status(response.status || 500).json({
          message: `The store returned a non-JSON response (${response.status}).`,
          code: 'invalid_response',
        });
      }
    } else {
      const msg =
        response.status === 409
          ? 'החנות החזירה Conflict (409). ייתכן שיש חסימה, גרסת API לא תואמת, או שיש לנסות מפתח REST אחר.'
          : `החנות החזירה תשובה ריקה (סטטוס ${response.status}).`;
      return res.status(response.status || 500).json({
        message: msg,
        code: 'empty_response',
      });
    }

    if (!response.ok) {
      return res.status(response.status).json(
        typeof dataOut === 'object' && dataOut !== null && 'message' in dataOut
          ? (dataOut as { message: string })
          : { message: `WooCommerce API Error: ${response.status}` }
      );
    }
    return res.status(200).json(dataOut);
  } catch (e: unknown) {
    const err = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({
      message: 'Failed to connect to WooCommerce store. Please check the URL and that the store is accessible.',
      code: 'connection_failed',
      debug: err,
    });
  }
}
