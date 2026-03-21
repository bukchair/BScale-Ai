// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCampaignSchedule } from '../../src/views/campaigns/useCampaignSchedule';

const defaultProps = {
  connectedAdPlatforms: ['Google', 'Meta'],
  selectedPlatforms: ['Google'],
  isHebrew: false,
  onMessage: vi.fn(),
};

describe('useCampaignSchedule', () => {
  // ── initial state ─────────────────────────────────────────────────────────

  it('initializes with empty weekly schedule', () => {
    const { result } = renderHook(() => useCampaignSchedule(defaultProps));
    // After mount effect, weeklySchedule should have a key for 'Google'
    expect(result.current.weeklySchedule).toHaveProperty('Google');
    expect(result.current.weeklySchedule.Google.mon).toEqual([]);
  });

  it('initializes selectedSchedulePlatform to first connected platform', () => {
    const { result } = renderHook(() => useCampaignSchedule(defaultProps));
    expect(['Google', 'Meta']).toContain(result.current.selectedSchedulePlatform);
  });

  // ── toggleScheduleHour ────────────────────────────────────────────────────

  it('toggleScheduleHour adds an hour when not present', () => {
    const { result } = renderHook(() => useCampaignSchedule(defaultProps));
    act(() => {
      result.current.toggleScheduleHour('Google', 'mon', 9);
    });
    expect(result.current.weeklySchedule.Google.mon).toContain(9);
  });

  it('toggleScheduleHour removes an hour when already present', () => {
    const { result } = renderHook(() => useCampaignSchedule(defaultProps));
    act(() => {
      result.current.toggleScheduleHour('Google', 'mon', 9);
    });
    act(() => {
      result.current.toggleScheduleHour('Google', 'mon', 9);
    });
    expect(result.current.weeklySchedule.Google.mon).not.toContain(9);
  });

  it('toggleScheduleHour keeps hours sorted', () => {
    const { result } = renderHook(() => useCampaignSchedule(defaultProps));
    act(() => {
      result.current.toggleScheduleHour('Google', 'tue', 14);
      result.current.toggleScheduleHour('Google', 'tue', 8);
      result.current.toggleScheduleHour('Google', 'tue', 20);
    });
    const hours = result.current.weeklySchedule.Google.tue;
    expect(hours).toEqual([...hours].sort((a, b) => a - b));
  });

  // ── toggleFullDay ─────────────────────────────────────────────────────────

  it('toggleFullDay selects all 24 hours', () => {
    const { result } = renderHook(() => useCampaignSchedule(defaultProps));
    act(() => {
      result.current.toggleFullDay('Google', 'wed');
    });
    expect(result.current.weeklySchedule.Google.wed).toHaveLength(24);
    expect(result.current.isFullDaySelected('Google', 'wed')).toBe(true);
  });

  it('toggleFullDay deselects all when already full', () => {
    const { result } = renderHook(() => useCampaignSchedule(defaultProps));
    act(() => { result.current.toggleFullDay('Google', 'wed'); });
    act(() => { result.current.toggleFullDay('Google', 'wed'); });
    expect(result.current.weeklySchedule.Google.wed).toHaveLength(0);
    expect(result.current.isFullDaySelected('Google', 'wed')).toBe(false);
  });

  // ── getActiveSlotsCount ───────────────────────────────────────────────────

  it('getActiveSlotsCount returns sum of all selected hours across days', () => {
    const { result } = renderHook(() => useCampaignSchedule(defaultProps));
    act(() => {
      result.current.toggleScheduleHour('Google', 'mon', 9);
      result.current.toggleScheduleHour('Google', 'mon', 10);
      result.current.toggleScheduleHour('Google', 'tue', 14);
    });
    expect(result.current.getActiveSlotsCount('Google')).toBe(3);
  });

  it('getActiveSlotsCount returns 0 for unknown platform', () => {
    const { result } = renderHook(() => useCampaignSchedule(defaultProps));
    expect(result.current.getActiveSlotsCount('TikTok')).toBe(0);
  });

  // ── addTimeRule ───────────────────────────────────────────────────────────

  it('addTimeRule adds a valid rule to timeRules', () => {
    const onMessage = vi.fn();
    const { result } = renderHook(() =>
      useCampaignSchedule({ ...defaultProps, onMessage })
    );
    act(() => { result.current.setRuleStartHour(9); });
    act(() => { result.current.setRuleEndHour(17); });
    act(() => { result.current.addTimeRule(); });
    expect(result.current.timeRules).toHaveLength(1);
    expect(result.current.timeRules[0].startHour).toBe(9);
    expect(result.current.timeRules[0].endHour).toBe(17);
  });

  it('addTimeRule rejects when endHour <= startHour', () => {
    const onMessage = vi.fn();
    const { result } = renderHook(() =>
      useCampaignSchedule({ ...defaultProps, onMessage })
    );
    // defaults are startHour=18, endHour=22; set endHour below startHour
    act(() => { result.current.setRuleEndHour(9); });
    act(() => { result.current.addTimeRule(); });
    expect(result.current.timeRules).toHaveLength(0);
    expect(onMessage).toHaveBeenCalledWith(expect.stringContaining('End hour'));
  });

  // ── removeTimeRule ────────────────────────────────────────────────────────

  it('removeTimeRule removes a rule by id', () => {
    const { result } = renderHook(() => useCampaignSchedule(defaultProps));
    act(() => { result.current.setRuleStartHour(8); });
    act(() => { result.current.setRuleEndHour(16); });
    act(() => { result.current.addTimeRule(); });
    const id = result.current.timeRules[0].id;
    act(() => {
      result.current.removeTimeRule(id);
    });
    expect(result.current.timeRules).toHaveLength(0);
  });
});
