import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/src/lib/auth/session';
import { googleLegacyBridge } from '@/src/lib/integrations/services/google-legacy-bridge';

const GA4_DATA_API = 'https://analyticsdata.googleapis.com/v1beta';
const normalizePropertyId = (value: string) => value.replace(/^properties\//, '').trim();

const toErrorMessage = (status: number, raw: string, parsed: unknown) => {
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    const rootError = obj.error;
    if (rootError && typeof rootError === 'object') {
      const msg = (rootError as Record<string, unknown>).message;
      if (typeof msg === 'string' && msg.trim()) return msg;
    }
    const msg = obj.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  if (raw.trim()) return `GA4 request failed (${status}): ${raw.slice(0, 240)}`;
  return `GA4 request failed (${status}).`;
};

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const { connection, accessToken } = await googleLegacyBridge.getConnectionWithAccessToken(user.id, 'GA4');
    const url = new URL(request.url);

    const queryPropertyId = normalizePropertyId(url.searchParams.get('property_id') || '');
    const fallbackPropertyId =
      connection.connectedAccounts.find((account) => account.isSelected)?.externalAccountId ||
      connection.connectedAccounts[0]?.externalAccountId ||
      '';
    const propertyId = normalizePropertyId(queryPropertyId || fallbackPropertyId);
    if (!propertyId) {
      return NextResponse.json({ message: 'Missing property_id for GA4 report.' }, { status: 400 });
    }

    const response = await fetch(`${GA4_DATA_API}/properties/${propertyId}:runReport`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'conversions' },
          { name: 'totalRevenue' },
        ],
      }),
    });

    const raw = await response.text();
    let parsed: unknown = {};
    try {
      parsed = raw ? JSON.parse(raw) : {};
    } catch {
      parsed = null;
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: toErrorMessage(response.status, raw, parsed) },
        { status: response.status }
      );
    }

    return NextResponse.json(parsed, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to load GA4 report for this user.' },
      { status: 500 }
    );
  }
}
