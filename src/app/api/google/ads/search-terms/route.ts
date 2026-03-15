import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/src/lib/auth/session';
import { integrationsEnv } from '@/src/lib/env/integrations-env';
import { googleLegacyBridge } from '@/src/lib/integrations/services/google-legacy-bridge';

const GOOGLE_ADS_API_BASE = 'https://googleads.googleapis.com/v22';
const normalizeCustomerId = (value: string) => value.replace(/\D/g, '');
const DATE_PARAM_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const normalizeDateParam = (value: string | null) => {
  const trimmed = (value || '').trim();
  return DATE_PARAM_REGEX.test(trimmed) ? trimmed : '';
};

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
  if (raw.trim()) return `Google Ads search terms request failed (${status}): ${raw.slice(0, 240)}`;
  return `Google Ads search terms request failed (${status}).`;
};

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const { connection, accessToken } = await googleLegacyBridge.getConnectionWithAccessToken(
      user.id,
      'GOOGLE_ADS'
    );

    const url = new URL(request.url);
    const queryCustomerId = normalizeCustomerId(url.searchParams.get('customer_id') || '');
    const fallbackCustomerId = googleLegacyBridge.pickSelectedAccountId(connection);
    const customerId = queryCustomerId || fallbackCustomerId;
    if (!customerId) {
      return NextResponse.json({ message: 'Missing customer_id for Google Ads search terms.' }, { status: 400 });
    }

    const queryLoginCustomerId = normalizeCustomerId(url.searchParams.get('login_customer_id') || '');
    const loginCustomerId =
      queryLoginCustomerId || googleLegacyBridge.getLoginCustomerId(connection.metadata) || undefined;

    const startDate = normalizeDateParam(url.searchParams.get('start_date'));
    const endDate = normalizeDateParam(url.searchParams.get('end_date'));
    const dateFilter =
      startDate && endDate ? `\n              AND segments.date BETWEEN '${startDate}' AND '${endDate}'` : '';

    const headers: Record<string, string> = {
      authorization: `Bearer ${accessToken}`,
      'developer-token': integrationsEnv.GOOGLE_ADS_DEVELOPER_TOKEN,
      'content-type': 'application/json',
    };
    if (loginCustomerId) headers['login-customer-id'] = loginCustomerId;

    const response = await fetch(`${GOOGLE_ADS_API_BASE}/customers/${customerId}/googleAds:search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `
          SELECT
            search_term_view.search_term,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.conversions_value
          FROM search_term_view
          WHERE metrics.impressions > 0${dateFilter}
          ORDER BY metrics.clicks DESC
          LIMIT 500
        `,
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
      {
        message:
          error instanceof Error ? error.message : 'Failed to load Google Ads search terms for this user.',
      },
      { status: 500 }
    );
  }
}
