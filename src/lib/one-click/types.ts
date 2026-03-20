// ─── One Click Campaign — shared types ───────────────────────────────────────

export type OneClickPlatform = 'Google' | 'Meta' | 'TikTok';
export type OneClickObjective = 'sales' | 'leads' | 'traffic';

export type OneClickProductInfo = {
  name: string;
  description?: string;
  price?: string;
  url?: string;
  /** Image URL from WooCommerce or other source — backend will download and upload to platforms */
  imageUrl?: string;
};

export type OneClickInput = {
  /** SHA-256(userId + canonicalised inputs) — caller must provide. */
  idempotencyKey: string;
  platforms: OneClickPlatform[];
  objective: OneClickObjective;
  /** Daily budget in account currency (USD/ILS/EUR etc.). */
  dailyBudget: number;
  country: string;
  /** BCP-47 language tag, e.g. "he" or "en". */
  language: string;
  product?: OneClickProductInfo;
  /** When true campaigns are created as ENABLED/ACTIVE instead of PAUSED */
  activateImmediately?: boolean;
};

export type PlatformAdCopy = {
  title: string;
  description: string;
  cta?: string;
};

export type OneClickStrategy = {
  campaignName: string;
  shortTitle: string;
  audiences: string[];
  platformCopy: Partial<Record<OneClickPlatform, PlatformAdCopy>>;
  objective: OneClickObjective;
};

export type PlatformResult = {
  ok: boolean;
  campaignId?: string;
  adId?: string;
  message: string;
  /** "Draft" = paused, "Active" = enabled/live */
  campaignStatus: 'Draft' | 'Active' | 'Error';
};

export type OneClickResult = {
  requestId: string;
  idempotencyKey: string;
  /** Aggregate status across all requested platforms. */
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  strategy: OneClickStrategy;
  results: Partial<Record<OneClickPlatform, PlatformResult>>;
};
