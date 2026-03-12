/**
 * Vercel Serverless: GET /api/google/ads/accounts
 * Lists Google Ads accounts accessible with the given access token.
 * Header: Authorization: Bearer <token>
 * Env: GOOGLE_ADS_DEVELOPER_TOKEN
 */

export default async function handler(
  req: { method?: string; headers?: { authorization?: string } },
  res: { status: (n: number) => { json: (o: object) => void }; json: (o: object) => void }
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const auth = req.headers?.authorization;
  const accessToken = auth?.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!accessToken) {
    return res.status(400).json({ message: 'Missing access token' });
  }

  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken) {
    return res.status(500).json({ message: 'Google Ads developer token not configured' });
  }

  try {
    const response = await fetch('https://googleads.googleapis.com/v17/customers:listAccessibleCustomers', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      const msg = data.error?.message || data.error?.description || data.message || 'Google Ads API error';
      return res.status(response.status).json({ message: msg });
    }
    return res.status(200).json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to list Google Ads accounts';
    return res.status(500).json({ message });
  }
}
