import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/src/lib/auth/session';
import { connectionService } from '@/src/lib/integrations/services/connection-service';
import { MetaProvider } from '@/src/lib/integrations/providers/meta/provider';
import { ok } from '@/src/lib/integrations/utils/api-response';

type MetaGraphError = {
  error?: { message?: string };
};

type MetaBusiness = { id?: string; name?: string };
type MetaPage = { id?: string; name?: string };
type MetaPixel = { id?: string; name?: string };

const META_GRAPH_VERSION = 'v21.0';
const META_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

const normalizeMetaAccountId = (value: string) => String(value || '').replace(/^act_/i, '').trim();
const toAccountResource = (value: string) => {
  const trimmed = normalizeMetaAccountId(value);
  if (!trimmed) return '';
  return `act_${trimmed}`;
};

const fetchMetaGraph = async <T>(path: string) => {
  const response = await fetch(`${META_GRAPH_BASE}${path}`);
  const parsed = (await response.json().catch(() => null)) as (T & MetaGraphError) | null;
  return {
    ok: response.ok,
    status: response.status,
    data: parsed,
  };
};

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    const connection = await connectionService.getByUserPlatform(user.id, 'META');
    if (!connection) {
      return NextResponse.json(
        { success: false, message: 'Meta connection is not available for this user.' },
        { status: 400 }
      );
    }

    const accessToken = await new MetaProvider().getAccessTokenForConnection(connection.id);
    const warnings: string[] = [];

    const adAccounts = connection.connectedAccounts
      .filter((account) => account.status !== 'ARCHIVED')
      .map((account) => ({
        id: normalizeMetaAccountId(account.externalAccountId),
        name: account.name || `Ad account ${account.externalAccountId}`,
        isSelected: account.isSelected,
      }));

    const businessResponse = await fetchMetaGraph<{ data?: MetaBusiness[] }>(
      `/me/businesses?fields=id,name&limit=200&access_token=${encodeURIComponent(accessToken)}`
    );
    const businesses = (businessResponse.data?.data || [])
      .filter((item) => item?.id)
      .map((item) => ({
        id: String(item.id).trim(),
        name: String(item.name || item.id).trim(),
      }));
    if (!businessResponse.ok) {
      warnings.push(
        businessResponse.data?.error?.message || `Failed to load Meta businesses (${businessResponse.status}).`
      );
    }

    const messageResponse = await fetchMetaGraph<{ data?: MetaPage[] }>(
      `/me/accounts?fields=id,name&limit=200&access_token=${encodeURIComponent(accessToken)}`
    );
    const messageAccounts = (messageResponse.data?.data || [])
      .filter((item) => item?.id)
      .map((item) => ({
        id: String(item.id).trim(),
        name: String(item.name || item.id).trim(),
      }));
    if (!messageResponse.ok) {
      warnings.push(
        messageResponse.data?.error?.message ||
          `Failed to load Meta messaging accounts (${messageResponse.status}).`
      );
    }

    const accountIdsForPixels = adAccounts.map((account) => account.id).filter(Boolean);
    const pixelsMap = new Map<string, { id: string; name: string; adAccountId: string }>();
    for (const accountId of accountIdsForPixels) {
      const accountResource = toAccountResource(accountId);
      if (!accountResource) continue;

      const pixelResponse = await fetchMetaGraph<{ data?: MetaPixel[] }>(
        `/${accountResource}/adspixels?fields=id,name&limit=200&access_token=${encodeURIComponent(accessToken)}`
      );

      if (!pixelResponse.ok) {
        warnings.push(
          pixelResponse.data?.error?.message ||
            `Failed to load pixels for account ${accountResource} (${pixelResponse.status}).`
        );
        continue;
      }

      for (const pixel of pixelResponse.data?.data || []) {
        const pixelId = String(pixel?.id || '').trim();
        if (!pixelId) continue;
        pixelsMap.set(`${accountId}:${pixelId}`, {
          id: pixelId,
          name: String(pixel?.name || pixelId).trim(),
          adAccountId: accountId,
        });
      }
    }

    const selectedAdAccount = adAccounts.find((account) => account.isSelected)?.id || adAccounts[0]?.id || '';
    const pixels = Array.from(pixelsMap.values());

    return ok('Meta assets loaded successfully.', {
      adAccounts,
      businesses,
      messageAccounts,
      pixels,
      warnings,
      defaultAdAccountId: selectedAdAccount,
      defaultBusinessId: businesses[0]?.id || '',
      defaultMessageAccountId: messageAccounts[0]?.id || '',
      defaultPixelId:
        pixels.find((pixel) => pixel.adAccountId === selectedAdAccount)?.id || pixels[0]?.id || '',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to load Meta assets.',
      },
      { status: 500 }
    );
  }
}

