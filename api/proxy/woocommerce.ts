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
  bodyData?: unknown,
  authMode: 'query' | 'header' | 'both' = 'query'
): Promise<Response> {
  const urlObj = new URL(targetUrl);
  if (authMode === 'query' || authMode === 'both') {
    urlObj.searchParams.append('consumer_key', key);
    urlObj.searchParams.append('consumer_secret', secret);
  }

  const auth = Buffer.from(`${key}:${secret}`).toString('base64');
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (compatible; BScale/1.0)',
    Accept: 'application/json',
  };
  if (authMode === 'header' || authMode === 'both') {
    headers.Authorization = `Basic ${auth}`;
  }
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
  // Allow any JSON-serializable value (object, array, etc.)
  res: { status: (n: number) => { json: (o: any) => void }; setHeader: (k: string, v: string) => void; json: (o: any) => void }
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

    const routeCandidates = [
      `${baseUrl}/wp-json/wc/v3/${endpointPath}`,
      `${baseUrl}/index.php/wp-json/wc/v3/${endpointPath}`,
      `${baseUrl}/wc-api/v3/${endpointPath}`,
    ];
    const authModes: Array<'query' | 'header' | 'both'> = ['query', 'header', 'both'];

    let lastStatus = 500;
    let lastPayload: unknown = null;
    const tried = new Set<string>();

    for (const route of routeCandidates) {
      for (const authMode of authModes) {
        const keyForDedup = `${route}::${authMode}`;
        if (tried.has(keyForDedup)) continue;
        tried.add(keyForDedup);

        const response = await tryFetch(route, key, secret, method, data, authMode);
        const text = await response.text();
        lastStatus = response.status || 500;

        if (!text) {
          lastPayload = {
            message:
              response.status === 409
                ? 'החנות החזירה Conflict (409). ייתכן שיש חסימה או מפתח REST לא תקף.'
                : `החנות החזירה תשובה ריקה (סטטוס ${response.status}).`,
            code: 'empty_response',
          };
          continue;
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          lastPayload = {
            message: `The store returned a non-JSON response (${response.status}).`,
            code: 'invalid_response',
          };
          continue;
        }

        if (response.ok) {
          return res.status(200).json(parsed);
        }

        lastPayload = parsed;
      }
    }

    if (lastPayload && typeof lastPayload === 'object') {
      return res.status(lastStatus).json(lastPayload);
    }

    return res.status(lastStatus).json({
      message: `WooCommerce API Error: ${lastStatus}`,
      code: 'woocommerce_error',
    });
  } catch (e: unknown) {
    const err = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({
      message: 'Failed to connect to WooCommerce store. Please check the URL and that the store is accessible.',
      code: 'connection_failed',
      debug: err,
    });
  }
}
