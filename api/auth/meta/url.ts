/**
 * Vercel Serverless: GET /api/auth/meta/url
 * Returns the Meta (Facebook) OAuth URL. Requires META_APP_ID and META_REDIRECT_URI in Vercel env.
 */
export default function handler(
  req: { method?: string },
  res: { setHeader: (k: string, v: string) => void; status: (n: number) => { json: (o: object) => void }; json: (o: object) => void }
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const appId = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI;

  if (!appId) {
    return res.status(500).json({ message: 'Meta App ID not configured' });
  }

  const scope = 'ads_management,ads_read,business_management,public_profile';
  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri || '')}&scope=${scope}&response_type=code`;

  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({ url: authUrl });
}
