import { describe, expect, it } from 'vitest';
import {
  toAmount,
  normalizeCampaignStatus,
  getStatusBadgeClass,
  formatPercent,
  hasMetaMetrics,
  hasGoogleMetrics,
  mergePlatformCampaignsPreferRich,
} from '../../src/views/campaigns/utils';

// ── toAmount ─────────────────────────────────────────────────────────────────

describe('toAmount', () => {
  it('returns a finite number as-is', () => {
    expect(toAmount(42)).toBe(42);
    expect(toAmount(0)).toBe(0);
    expect(toAmount(-5.5)).toBe(-5.5);
  });

  it('parses numeric strings', () => {
    expect(toAmount('12.50')).toBe(12.5);
    expect(toAmount('1,234.56')).toBeCloseTo(1234.56, 5);
    expect(toAmount('  7  ')).toBe(7);
  });

  it('returns 0 for non-numeric / Infinity / NaN', () => {
    expect(toAmount(NaN)).toBe(0);
    expect(toAmount(Infinity)).toBe(0);
    expect(toAmount('abc')).toBe(0);
    expect(toAmount(null)).toBe(0);
    expect(toAmount(undefined)).toBe(0);
    expect(toAmount('')).toBe(0);
  });
});

// ── normalizeCampaignStatus ───────────────────────────────────────────────────

describe('normalizeCampaignStatus', () => {
  it('maps active-family values to Active', () => {
    expect(normalizeCampaignStatus('ACTIVE')).toBe('Active');
    expect(normalizeCampaignStatus('active')).toBe('Active');
    expect(normalizeCampaignStatus('enabled')).toBe('Active');
    expect(normalizeCampaignStatus('serving')).toBe('Active');
  });

  it('maps paused / disabled to Paused', () => {
    expect(normalizeCampaignStatus('PAUSED')).toBe('Paused');
    expect(normalizeCampaignStatus('paused')).toBe('Paused');
    expect(normalizeCampaignStatus('disabled')).toBe('Paused');
  });

  it('maps removed / deleted / archived to Removed', () => {
    expect(normalizeCampaignStatus('REMOVED')).toBe('Removed');
    expect(normalizeCampaignStatus('deleted')).toBe('Removed');
    expect(normalizeCampaignStatus('archived')).toBe('Removed');
  });

  it('maps pending / review / learning to Pending', () => {
    expect(normalizeCampaignStatus('PENDING_REVIEW')).toBe('Pending');
    expect(normalizeCampaignStatus('in_review')).toBe('Pending');
    expect(normalizeCampaignStatus('learning')).toBe('Pending');
  });

  it('maps scheduled to Scheduled', () => {
    expect(normalizeCampaignStatus('SCHEDULED')).toBe('Scheduled');
  });

  it('maps draft to Draft', () => {
    expect(normalizeCampaignStatus('draft')).toBe('Draft');
  });

  it('maps error / fail to Error', () => {
    expect(normalizeCampaignStatus('error')).toBe('Error');
    expect(normalizeCampaignStatus('FAILED')).toBe('Error');
  });

  it('returns Unknown for blank or unrecognized values', () => {
    expect(normalizeCampaignStatus('')).toBe('Unknown');
    expect(normalizeCampaignStatus(null)).toBe('Unknown');
    expect(normalizeCampaignStatus('some_weird_status')).toBe('Unknown');
  });
});

// ── getStatusBadgeClass ───────────────────────────────────────────────────────

describe('getStatusBadgeClass', () => {
  it('returns green class for Active', () => {
    expect(getStatusBadgeClass('Active')).toBe('bg-green-100 text-green-800');
  });

  it('returns indigo class for Scheduled and Pending', () => {
    expect(getStatusBadgeClass('Scheduled')).toBe('bg-indigo-100 text-indigo-800');
    expect(getStatusBadgeClass('Pending')).toBe('bg-indigo-100 text-indigo-800');
  });

  it('returns yellow class for Paused', () => {
    expect(getStatusBadgeClass('Paused')).toBe('bg-yellow-100 text-yellow-800');
  });

  it('returns rose class for Removed', () => {
    expect(getStatusBadgeClass('Removed')).toBe('bg-rose-100 text-rose-800');
  });

  it('returns red class for Error', () => {
    expect(getStatusBadgeClass('Error')).toBe('bg-red-100 text-red-800');
  });

  it('returns slate class for Draft', () => {
    expect(getStatusBadgeClass('Draft')).toBe('bg-slate-100 text-slate-700');
  });

  it('returns gray class for unknown statuses', () => {
    expect(getStatusBadgeClass('Unknown')).toBe('bg-gray-100 text-gray-700');
    expect(getStatusBadgeClass('')).toBe('bg-gray-100 text-gray-700');
  });
});

// ── formatPercent ─────────────────────────────────────────────────────────────

describe('formatPercent', () => {
  it('formats numbers with 2 decimal places by default', () => {
    expect(formatPercent(12.5)).toBe('12.50%');
    expect(formatPercent(0)).toBe('0.00%');
    expect(formatPercent(100)).toBe('100.00%');
  });

  it('respects fractionDigits parameter', () => {
    expect(formatPercent(12.5678, 0)).toBe('13%');
    expect(formatPercent(12.5, 1)).toBe('12.5%');
  });

  it('handles string input', () => {
    expect(formatPercent('5.5')).toBe('5.50%');
  });

  it('returns 0.00% for invalid input', () => {
    expect(formatPercent(null)).toBe('0.00%');
    expect(formatPercent('abc')).toBe('0.00%');
  });
});

// ── hasMetaMetrics / hasGoogleMetrics ─────────────────────────────────────────

describe('hasMetaMetrics', () => {
  it('returns true when at least one metric is > 0', () => {
    expect(hasMetaMetrics({ spend: 10 })).toBe(true);
    expect(hasMetaMetrics({ impressions: 1000 })).toBe(true);
    expect(hasMetaMetrics({ reach: 500 })).toBe(true);
  });

  it('returns false when all metrics are 0 or missing', () => {
    expect(hasMetaMetrics({ spend: 0, impressions: 0 })).toBe(false);
    expect(hasMetaMetrics({})).toBe(false);
    expect(hasMetaMetrics({ name: 'Campaign A' })).toBe(false);
  });
});

describe('hasGoogleMetrics', () => {
  it('returns true when at least one metric is > 0', () => {
    expect(hasGoogleMetrics({ spend: 5 })).toBe(true);
    expect(hasGoogleMetrics({ costPerConversion: 2 })).toBe(true);
  });

  it('returns false when all metrics are 0 or missing', () => {
    expect(hasGoogleMetrics({ spend: 0 })).toBe(false);
    expect(hasGoogleMetrics({})).toBe(false);
  });
});

// ── mergePlatformCampaignsPreferRich ──────────────────────────────────────────

describe('mergePlatformCampaignsPreferRich', () => {
  const rich = (id: string) => ({ id, name: `Campaign ${id}`, status: 'Active', spend: 100 });
  const minimal = (id: string) => ({ id, name: `Campaign ${id}`, status: 'Active' });

  it('returns incoming rows unchanged when no existing match', () => {
    const result = mergePlatformCampaignsPreferRich([], [rich('1')], hasMetaMetrics);
    expect(result).toEqual([rich('1')]);
  });

  it('keeps richer existing row data when incoming is minimal', () => {
    const existing = [rich('1')];
    const incoming = [minimal('1')];
    const result = mergePlatformCampaignsPreferRich(existing, incoming, hasMetaMetrics);
    // incoming has no spend => should inherit spend from existing
    expect(result[0].spend).toBe(100);
  });

  it('uses incoming row when it has metrics too', () => {
    const existing = [{ id: '1', name: 'Old Name', spend: 100 }];
    const incoming = [{ id: '1', name: 'New Name', spend: 200 }];
    const result = mergePlatformCampaignsPreferRich(existing, incoming, hasMetaMetrics);
    // both have metrics, so incoming wins
    expect(result[0].spend).toBe(200);
    expect(result[0].name).toBe('New Name');
  });

  it('preserves name and status from incoming even when keeping rich existing', () => {
    const existing = [{ id: '1', name: 'Old', status: 'Paused', spend: 50 }];
    const incoming = [{ id: '1', name: 'New', status: 'Active' }];
    const result = mergePlatformCampaignsPreferRich(existing, incoming, hasMetaMetrics);
    expect(result[0].name).toBe('New');
    expect(result[0].status).toBe('Active');
    expect(result[0].spend).toBe(50);
  });

  it('handles rows without id (passes through unchanged)', () => {
    const existing = [{ id: '1', spend: 100 }];
    const incoming = [{ name: 'No ID row' }];
    const result = mergePlatformCampaignsPreferRich(existing, incoming, hasMetaMetrics);
    expect(result[0]).toEqual({ name: 'No ID row' });
  });
});
