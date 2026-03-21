import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/src/lib/auth/session';
import { httpStatusFromError } from '@/src/lib/integrations/core/errors';
import { integrationsEnv } from '@/src/lib/env/integrations-env';
import { googleLegacyBridge } from '@/src/lib/integrations/services/google-legacy-bridge';
import { connectionService } from '@/src/lib/integrations/services/connection-service';
import { tokenService } from '@/src/lib/integrations/services/token-service';
import { MetaProvider } from '@/src/lib/integrations/providers/meta/provider';
import { TikTokProvider } from '@/src/lib/integrations/providers/tiktok/provider';
import { GOOGLE_ADS_API_BASE, META_GRAPH_BASE, TIKTOK_API_BASE } from '@/src/lib/constants/api-urls';
import { createGoogleDraft } from '@/src/lib/one-click/builders/google';
import { createMetaDraft } from '@/src/lib/one-click/builders/meta';
import { createTikTokDraft } from '@/src/lib/one-click/builders/tiktok';
import type {
  OneClickObjective,
  OneClickPlatform,
  OneClickProductInfo,
  OneClickStrategy,
  PlatformResult,
} from '@/src/lib/one-click/types';

type ObjectiveType = 'sales' | 'traffic' | 'leads' | 'awareness' | 'retargeting';
type PlatformName = 'Google' | 'Meta' | 'TikTok';
type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
type WeeklySchedule = Record<string, Record<DayKey, number[]>>;

type CreateScheduledCampaignBody = {
  campaignName?: string;
  shortTitle?: string;
  brief?: string;
  objective?: ObjectiveType;
  dailyBudget?: number;
  country?: string;
  platforms?: PlatformName[];
  weeklySchedule?: WeeklySchedule;
  audiences?: string[];
  contentType?: string;
  productType?: string;
  serviceType?: string;
  wooProductName?: string;
  product?: {
    name?: string;
    description?: string;
    price?: string;
    url?: string;
    imageUrl?: string;
  };
  platformCopyDrafts?: Partial<Record<PlatformName, { title?: string; description?: string }>>;
};

type PlatformCreateResult = {
  platform: PlatformName;
  ok: boolean;
  campaignId?: string;
  message: string;
  status: 'Scheduled' | 'Draft';
};

const DAY_BY_JS: Record<number, DayKey> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
};

const mapObjectiveToMeta = (objective: ObjectiveType) => {
  if (objective === 'sales') return 'OUTCOME_SALES';
  if (objective === 'traffic') return 'OUTCOME_TRAFFIC';
  if (objective === 'leads') return 'OUTCOME_LEADS';
  if (objective === 'awareness') return 'OUTCOME_AWARENESS';
  return 'OUTCOME_ENGAGEMENT';
};

const mapObjectiveToTikTok = (objective: ObjectiveType) => {
  if (objective === 'sales') return 'CONVERSIONS';
  if (objective === 'leads') return 'LEAD_GENERATION';
  if (objective === 'traffic') return 'TRAFFIC';
  if (objective === 'retargeting') return 'CONVERSIONS';
  return 'REACH';
};

const todayYmd = () => {
  const date = new Date();
  const y = date.getUTCFullYear();
  const m = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const d = `${date.getUTCDate()}`.padStart(2, '0');
  // Google Ads REST API requires YYYY-MM-DD format (not YYYYMMDD)
  return `${y}-${m}-${d}`;
};

const sanitizeName = (value: string) => value.trim().slice(0, 120);
const sanitizeAudienceName = (value: string) => value.trim().slice(0, 80);
const escapeGaqlLike = (value: string) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const extractErrorMessage = async (response: Response) => {
  const raw = await response.text();
  if (!raw) return `Request failed with status ${response.status}`;
  try {
    const parsed = JSON.parse(raw) as Record<string, any>;
    return (
      parsed?.error?.message ||
      parsed?.message ||
      parsed?.data?.message ||
      raw.slice(0, 280)
    );
  } catch {
    return raw.slice(0, 280);
  }
};

const isHourActiveForPlatform = (schedule: WeeklySchedule | undefined, platform: PlatformName) => {
  const platformSchedule = schedule?.[platform];
  if (!platformSchedule) return false;
  const now = new Date();
  const day = DAY_BY_JS[now.getDay()];
  const hour = now.getHours();
  const activeHours = Array.isArray(platformSchedule[day]) ? platformSchedule[day] : [];
  return activeHours.includes(hour);
};

const normalizeAudienceInputs = (audiences: unknown): string[] => {
  if (!Array.isArray(audiences)) return [];
  const cleaned = audiences
    .map((item) => sanitizeAudienceName(String(item || '')))
    .filter((item) => item.length > 0);
  return [...new Set(cleaned)];
};

const mapObjectiveToOneClick = (objective: ObjectiveType): OneClickObjective => {
  if (objective === 'sales' || objective === 'retargeting') return 'sales';
  if (objective === 'leads') return 'leads';
  return 'traffic';
};

const buildOneClickStrategy = (
  body: CreateScheduledCampaignBody,
  resolvedCampaignName: string,
  objective: OneClickObjective
): OneClickStrategy => {
  const normalizedAudience = normalizeAudienceInputs(body.audiences);
  const drafts = body.platformCopyDrafts || {};
  const getDraft = (platform: OneClickPlatform) => ({
    title: sanitizeName(String(drafts?.[platform]?.title || body.shortTitle || resolvedCampaignName)),
    description: String(drafts?.[platform]?.description || body.brief || '').trim().slice(0, 240),
    cta: 'Shop Now',
  });
  return {
    campaignName: sanitizeName(resolvedCampaignName),
    shortTitle: sanitizeName(String(body.shortTitle || resolvedCampaignName)).slice(0, 90),
    audiences: normalizedAudience,
    objective,
    platformCopy: {
      Google: getDraft('Google'),
      Meta: getDraft('Meta'),
      TikTok: getDraft('TikTok'),
    },
  };
};

const buildProductPayload = (
  body: CreateScheduledCampaignBody,
  resolvedCampaignName: string
): OneClickProductInfo | undefined => {
  const direct = body.product || {};
  const product: OneClickProductInfo = {
    name: sanitizeName(String(direct.name || body.wooProductName || body.shortTitle || resolvedCampaignName)),
    description: String(direct.description || body.brief || '').trim().slice(0, 500),
    price: String(direct.price || '').trim().slice(0, 30),
    url: String(direct.url || '').trim().slice(0, 500),
    imageUrl: String(direct.imageUrl || '').trim().slice(0, 1000) || undefined,
  };
  if (!product.name && !product.description && !product.url && !product.imageUrl) return undefined;
  return product;
};

const isIncompletePlatformResult = (result: PlatformResult): boolean => {
  if (!result.ok) return true;
  const message = String(result.message || '').toLowerCase();
  return (
    message.includes('ad group failed') ||
    message.includes('ad set failed') ||
    message.includes('creative failed') ||
    message.includes('no image available') ||
    message.includes('skipped')
  );
};

const applyGoogleAudiencesToCampaign = async (input: {
  customerId: string;
  campaignId: string;
  headers: Record<string, string>;
  audienceNames: string[];
}) => {
  let applied = 0;
  let failed = 0;
  const notes: string[] = [];
  for (const audienceName of input.audienceNames) {
    try {
      const searchResponse = await fetch(
        `${GOOGLE_ADS_API_BASE}/customers/${input.customerId}/googleAds:search`,
        {
          method: 'POST',
          headers: input.headers,
          body: JSON.stringify({
            query: `
              SELECT user_list.resource_name, user_list.name
              FROM user_list
              WHERE user_list.status != 'REMOVED'
                AND user_list.name LIKE '%${escapeGaqlLike(audienceName)}%'
              LIMIT 1
            `,
          }),
        }
      );
      if (!searchResponse.ok) {
        failed += 1;
        notes.push(`Google audience lookup failed for "${audienceName}".`);
        continue;
      }
      const lookupPayload = (await searchResponse.json().catch(() => ({}))) as Record<string, any>;
      const userListResource = String(lookupPayload?.results?.[0]?.userList?.resourceName || '').trim();
      if (!userListResource) {
        failed += 1;
        notes.push(`Google user list not found for "${audienceName}".`);
        continue;
      }

      const criteriaResponse = await fetch(
        `${GOOGLE_ADS_API_BASE}/customers/${input.customerId}/campaignCriteria:mutate`,
        {
          method: 'POST',
          headers: input.headers,
          body: JSON.stringify({
            operations: [
              {
                create: {
                  campaign: `customers/${input.customerId}/campaigns/${input.campaignId}`,
                  userList: { userList: userListResource },
                },
              },
            ],
          }),
        }
      );
      if (!criteriaResponse.ok) {
        const message = (await extractErrorMessage(criteriaResponse)).toLowerCase();
        if (message.includes('already exists')) {
          applied += 1;
          continue;
        }
        failed += 1;
        notes.push(`Google audience apply failed for "${audienceName}".`);
        continue;
      }
      applied += 1;
    } catch {
      failed += 1;
      notes.push(`Google audience apply crashed for "${audienceName}".`);
    }
  }

  return { applied, failed, notes };
};

const createMetaSavedAudiences = async (input: {
  adAccountResource: string;
  accessToken: string;
  audienceNames: string[];
}) => {
  let created = 0;
  let failed = 0;
  const notes: string[] = [];
  for (const audienceName of input.audienceNames) {
    try {
      const form = new URLSearchParams();
      form.set('name', audienceName);
      form.set('description', `Created by BScale AI smart campaign`);
      form.set('targeting', JSON.stringify({ geo_locations: { countries: ['IL'] } }));
      form.set('access_token', input.accessToken);
      const response = await fetch(`${META_GRAPH_BASE}/${input.adAccountResource}/saved_audiences`, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      });
      if (!response.ok) {
        failed += 1;
        notes.push(`Meta saved audience failed for "${audienceName}".`);
        continue;
      }
      created += 1;
    } catch {
      failed += 1;
      notes.push(`Meta saved audience crashed for "${audienceName}".`);
    }
  }
  return { created, failed, notes };
};

const createGoogleCampaign = async (
  userId: string,
  body: CreateScheduledCampaignBody
): Promise<PlatformCreateResult> => {
  const activeNow = isHourActiveForPlatform(body.weeklySchedule, 'Google');
  const objective = mapObjectiveToOneClick((body.objective || 'sales') as ObjectiveType);
  const strategy = buildOneClickStrategy(
    body,
    sanitizeName(body.campaignName || body.shortTitle || 'BScale Campaign'),
    objective
  );
  const product = buildProductPayload(body, strategy.campaignName);
  const result = await createGoogleDraft(
    userId,
    strategy.campaignName,
    objective,
    Math.max(Number(body.dailyBudget) || 20, 1),
    strategy,
    activeNow,
    String(body.country || 'IL'),
    product
  );
  return {
    platform: 'Google',
    ok: !isIncompletePlatformResult(result),
    campaignId: result.campaignId,
    message: result.message,
    status: activeNow ? 'Scheduled' : 'Draft',
  };
};

const createMetaCampaign = async (
  userId: string,
  body: CreateScheduledCampaignBody,
  mediaBuffer?: Buffer,
  mediaMimeType?: string
): Promise<PlatformCreateResult> => {
  const activeNow = isHourActiveForPlatform(body.weeklySchedule, 'Meta');
  const objective = mapObjectiveToOneClick((body.objective || 'sales') as ObjectiveType);
  const strategy = buildOneClickStrategy(
    body,
    sanitizeName(body.campaignName || body.shortTitle || 'BScale Campaign'),
    objective
  );
  const product = buildProductPayload(body, strategy.campaignName);
  const result = await createMetaDraft(
    userId,
    strategy.campaignName,
    objective,
    Math.max(Number(body.dailyBudget) || 20, 1),
    strategy,
    activeNow,
    String(body.country || 'IL'),
    product,
    mediaBuffer,
    mediaMimeType
  );
  return {
    platform: 'Meta',
    ok: !isIncompletePlatformResult(result),
    campaignId: result.campaignId,
    message: result.message,
    status: activeNow ? 'Scheduled' : 'Draft',
  };
};

const createTikTokCampaign = async (
  userId: string,
  body: CreateScheduledCampaignBody,
  mediaBuffer?: Buffer,
  mediaMimeType?: string
): Promise<PlatformCreateResult> => {
  const activeNow = isHourActiveForPlatform(body.weeklySchedule, 'TikTok');
  const objective = mapObjectiveToOneClick((body.objective || 'sales') as ObjectiveType);
  const strategy = buildOneClickStrategy(
    body,
    sanitizeName(body.campaignName || body.shortTitle || 'BScale Campaign'),
    objective
  );
  const product = buildProductPayload(body, strategy.campaignName);
  const result = await createTikTokDraft(
    userId,
    strategy.campaignName,
    objective,
    Math.max(Number(body.dailyBudget) || 50, 50),
    strategy,
    activeNow,
    String(body.country || 'IL'),
    product,
    mediaBuffer,
    mediaMimeType
  );
  return {
    platform: 'TikTok',
    ok: !isIncompletePlatformResult(result),
    campaignId: result.campaignId,
    message: result.message,
    status: activeNow ? 'Scheduled' : 'Draft',
  };
};

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    let body: CreateScheduledCampaignBody | null = null;
    let mediaBuffer: Buffer | undefined;
    let mediaMimeType: string | undefined;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const rawBody = form.get('body');
      if (typeof rawBody === 'string') {
        body = (JSON.parse(rawBody) as CreateScheduledCampaignBody) || null;
      }
      const mediaFile = form.get('media');
      if (mediaFile instanceof File && mediaFile.size > 0) {
        mediaBuffer = Buffer.from(await mediaFile.arrayBuffer());
        mediaMimeType = mediaFile.type || 'image/jpeg';
      }
    } else {
      body = (await request.json().catch(() => null)) as CreateScheduledCampaignBody | null;
    }
    const resolvedCampaignName = sanitizeName(
      String(
        body?.campaignName ||
          body?.shortTitle ||
          body?.brief?.slice(0, 80) ||
          'BScale Campaign'
      )
    );
    if (!resolvedCampaignName) {
      return NextResponse.json(
        {
          success: false,
          message: 'campaignName (or shortTitle) is required.',
        },
        { status: 400 }
      );
    }

    let platforms = (Array.isArray(body?.platforms) ? body?.platforms : []).filter(
      (platform): platform is PlatformName =>
        platform === 'Google' || platform === 'Meta' || platform === 'TikTok'
    );
    if (!platforms.length) {
      const [googleConnection, metaConnection, tiktokConnection] = await Promise.all([
        connectionService.getByUserPlatform(user.id, 'GOOGLE_ADS'),
        connectionService.getByUserPlatform(user.id, 'META'),
        connectionService.getByUserPlatform(user.id, 'TIKTOK'),
      ]);
      platforms = [
        googleConnection?.status === 'CONNECTED' ? 'Google' : null,
        metaConnection?.status === 'CONNECTED' ? 'Meta' : null,
        tiktokConnection?.status === 'CONNECTED' ? 'TikTok' : null,
      ].filter((value): value is PlatformName => Boolean(value));
    }
    if (!platforms.length) {
      return NextResponse.json(
        {
          success: false,
          message: 'No connected ad platforms were provided.',
        },
        { status: 400 }
      );
    }

    const normalizedBody: CreateScheduledCampaignBody = {
      ...(body || {}),
      campaignName: resolvedCampaignName,
      platforms,
    };

    const results: PlatformCreateResult[] = [];
    for (const platform of platforms) {
      if (platform === 'Google') {
        results.push(await createGoogleCampaign(user.id, normalizedBody));
      } else if (platform === 'Meta') {
        results.push(await createMetaCampaign(user.id, normalizedBody, mediaBuffer, mediaMimeType));
      } else if (platform === 'TikTok') {
        results.push(await createTikTokCampaign(user.id, normalizedBody, mediaBuffer, mediaMimeType));
      }
    }

    const successCount = results.filter((item) => item.ok).length;
    return NextResponse.json(
      {
        success: successCount > 0,
        createdCount: successCount,
        failedCount: results.length - successCount,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create scheduled campaigns.',
      },
      { status: httpStatusFromError(error) }
    );
  }
}
