import { describe, expect, it } from 'vitest';
import { normalizeHour, sanitizeHours } from '../../src/views/campaigns/useCampaignSchedule';
import { stripHtmlToText, createEmptyDaySchedule, DAY_KEYS } from '../../src/views/campaigns/types';

// ── normalizeHour ─────────────────────────────────────────────────────────────

describe('normalizeHour', () => {
  it('clamps values to [0, 23]', () => {
    expect(normalizeHour(0)).toBe(0);
    expect(normalizeHour(23)).toBe(23);
    expect(normalizeHour(-1)).toBe(0);
    expect(normalizeHour(24)).toBe(23);
    expect(normalizeHour(100)).toBe(23);
  });

  it('rounds fractional hours', () => {
    expect(normalizeHour(5.6)).toBe(6);
    expect(normalizeHour(5.4)).toBe(5);
    expect(normalizeHour(12.5)).toBe(13);
  });

  it('returns 0 for non-finite values', () => {
    expect(normalizeHour(NaN)).toBe(0);
    expect(normalizeHour(Infinity)).toBe(0);
    expect(normalizeHour(-Infinity)).toBe(0);
  });
});

// ── sanitizeHours ─────────────────────────────────────────────────────────────

describe('sanitizeHours', () => {
  it('deduplicates and sorts hours', () => {
    expect(sanitizeHours([3, 1, 2, 1, 3])).toEqual([1, 2, 3]);
  });

  it('clamps out-of-range values', () => {
    expect(sanitizeHours([-1, 0, 24, 23])).toEqual([0, 23]);
  });

  it('returns empty array for empty input', () => {
    expect(sanitizeHours([])).toEqual([]);
  });

  it('rounds and deduplicates fractional hours', () => {
    // 5.4 rounds to 5, 5.6 rounds to 6 — both included
    expect(sanitizeHours([5.4, 5.6])).toEqual([5, 6]);
    // 5.1 and 5.4 both round to 5 — deduplicated
    expect(sanitizeHours([5.1, 5.4])).toEqual([5]);
  });

  it('preserves a single valid hour', () => {
    expect(sanitizeHours([12])).toEqual([12]);
  });
});

// ── stripHtmlToText ───────────────────────────────────────────────────────────

describe('stripHtmlToText', () => {
  it('removes HTML tags', () => {
    expect(stripHtmlToText('<p>Hello <b>world</b></p>')).toBe('Hello world');
  });

  it('collapses multiple spaces', () => {
    expect(stripHtmlToText('Hello   world')).toBe('Hello world');
  });

  it('trims leading/trailing whitespace', () => {
    expect(stripHtmlToText('  trimmed  ')).toBe('trimmed');
  });

  it('handles empty string', () => {
    expect(stripHtmlToText('')).toBe('');
  });

  it('handles null / undefined gracefully', () => {
    expect(stripHtmlToText(null)).toBe('');
    expect(stripHtmlToText(undefined)).toBe('');
  });

  it('returns plain text unchanged', () => {
    expect(stripHtmlToText('plain text')).toBe('plain text');
  });
});

// ── createEmptyDaySchedule ────────────────────────────────────────────────────

describe('createEmptyDaySchedule', () => {
  it('has all 7 day keys', () => {
    const schedule = createEmptyDaySchedule();
    expect(Object.keys(schedule).sort()).toEqual([...DAY_KEYS].sort());
  });

  it('initializes every day with an empty array', () => {
    const schedule = createEmptyDaySchedule();
    for (const day of DAY_KEYS) {
      expect(schedule[day]).toEqual([]);
    }
  });

  it('returns a new object each call (no shared reference)', () => {
    const a = createEmptyDaySchedule();
    const b = createEmptyDaySchedule();
    a.mon.push(9);
    expect(b.mon).toEqual([]);
  });
});
