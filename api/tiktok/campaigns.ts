/**
 * Vercel Serverless: GET /api/tiktok/campaigns
 * Fetches TikTok ad campaigns. Query: advertiser_id. Header: Authorization: Bearer <token>
 * (TikTok API expects Access-Token header; we accept Bearer and forward as Access-Token.)
 */

export default async function handler(
  req: { method?: string; query?: { advertiser_id?: string }; headers?: { authorization?: string } },
  res: { status: (n: number) => { json: (o: object) => void }; json: (o: object) => void }
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const auth = req.headers?.authorization;
  const accessToken = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  const advertiserId = req.query?.advertiser_id;

  if (!accessToken || !advertiserId) {
    return res.status(400).json({ message: 'Missing access token or advertiser ID' });
  }

  try {
    const url = `https://business-api.tiktok.com/open_api/v1.3/campaign/get/?advertiser_id=${encodeURIComponent(advertiserId)}`;
    const response = await fetch(url, {
      headers: {
        'Access-Token': accessToken,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ message: data.message || 'TikTok API error' });
    }
    return res.status(200).json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to fetch TikTok campaigns';
    return res.status(500).json({ message });
  }
}
