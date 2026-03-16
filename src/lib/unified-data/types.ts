export type UnifiedPlatform = 'Google' | 'Meta' | 'TikTok';

export type UnifiedEntityStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'REMOVED'
  | 'PENDING'
  | 'DRAFT'
  | 'UNKNOWN';

export type UnifiedEntityType = 'campaign' | 'adGroup' | 'ad';

export type UnifiedDateRange = {
  startDate?: string;
  endDate?: string;
};

export type UnifiedAccount = {
  id: string;
  platform: UnifiedPlatform;
  externalId: string;
  name: string;
  currency?: string;
  timezone?: string;
  status: UnifiedEntityStatus;
  metadata?: Record<string, unknown>;
};

export type UnifiedCampaign = {
  id: string;
  platform: UnifiedPlatform;
  externalId: string;
  accountId: string;
  name: string;
  status: UnifiedEntityStatus;
  objective?: string;
  channelType?: string;
  startDate?: string;
  endDate?: string;
  budgetId?: string;
  adGroupIds: string[];
  adIds: string[];
  metadata?: Record<string, unknown>;
  providerData?: Record<string, unknown>;
};

export type UnifiedAdGroup = {
  id: string;
  platform: UnifiedPlatform;
  externalId: string;
  accountId: string;
  campaignId: string;
  name: string;
  status: UnifiedEntityStatus;
  isAggregate: boolean;
  metadata?: Record<string, unknown>;
};

export type UnifiedAd = {
  id: string;
  platform: UnifiedPlatform;
  externalId: string;
  accountId: string;
  campaignId: string;
  adGroupId: string;
  name: string;
  status: UnifiedEntityStatus;
  isAggregate: boolean;
  metadata?: Record<string, unknown>;
};

export type UnifiedMetricSnapshot = {
  id: string;
  platform: UnifiedPlatform;
  entityType: UnifiedEntityType;
  entityId: string;
  dateRange?: UnifiedDateRange;
  impressions: number;
  clicks: number;
  reach: number;
  frequency: number;
  spend: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
  cpa: number;
};

export type UnifiedConversionSnapshot = {
  id: string;
  platform: UnifiedPlatform;
  entityType: UnifiedEntityType;
  entityId: string;
  dateRange?: UnifiedDateRange;
  count: number;
  value: number;
  metadata?: Record<string, unknown>;
};

export type UnifiedBudgetSnapshot = {
  id: string;
  platform: UnifiedPlatform;
  entityType: UnifiedEntityType;
  entityId: string;
  dailyAmount?: number;
  lifetimeAmount?: number;
  currency?: string;
  period?: string;
  metadata?: Record<string, unknown>;
};

export type UnifiedDataLayer = {
  generatedAt: string;
  accounts: UnifiedAccount[];
  campaigns: UnifiedCampaign[];
  adGroups: UnifiedAdGroup[];
  ads: UnifiedAd[];
  metrics: UnifiedMetricSnapshot[];
  conversions: UnifiedConversionSnapshot[];
  budgets: UnifiedBudgetSnapshot[];
};

export const createEmptyUnifiedDataLayer = (): UnifiedDataLayer => ({
  generatedAt: new Date().toISOString(),
  accounts: [],
  campaigns: [],
  adGroups: [],
  ads: [],
  metrics: [],
  conversions: [],
  budgets: [],
});
