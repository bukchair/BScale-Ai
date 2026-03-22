// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CampaignSchedulePanel } from '../../src/views/campaigns/CampaignSchedulePanel';
import type { DayHours, DayKey, TimeRule, WeeklySchedule } from '../../src/views/campaigns/types';
import { DAY_KEYS } from '../../src/views/campaigns/types';

afterEach(cleanup);

// ── Helpers ───────────────────────────────────────────────────────────────────

const emptySchedule = (): DayHours =>
  Object.fromEntries(DAY_KEYS.map((d) => [d, [] as number[]])) as DayHours;

const makeRule = (id: string): TimeRule => ({
  id,
  platform: 'Google',
  startHour: 9,
  endHour: 17,
  action: 'boost',
  minRoas: 3,
  reason: 'morning',
});

const dayLabels: Record<DayKey, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

const text = {
  timingRulesTitle: 'Timing Rules',
  bestWindows: 'Best windows',
  addRule: 'Add Rule',
  scheduleTitle: 'Schedule',
  schedulePlatformLabel: 'Platform',
  activeSlotsLabel: 'active slots',
  weeklyTitle: 'Weekly schedule',
  weeklyActiveSlots: 'Active hours',
  markFullDay: 'Mark full day',
  unmarkFullDay: 'Unmark full day',
  noConnectedPlatforms: 'No platforms',
};

const baseProps = {
  isHebrew: false,
  connectedAdPlatforms: ['Google', 'Meta'],
  selectedPlatforms: ['Google'],
  weeklySchedule: { Google: emptySchedule(), Meta: emptySchedule() } as Record<string, WeeklySchedule[string]>,
  timeRules: [] as TimeRule[],
  hourOptions: [8, 9, 10, 17],
  dayLabels: dayLabels as Record<string, string>,
  aiRecommendedHoursByPlatform: { Google: [9, 10], Meta: [] },
  rulePlatform: 'Google',
  ruleStartHour: 9,
  ruleEndHour: 17,
  ruleAction: 'boost' as const,
  ruleMinRoas: 3,
  ruleReason: '',
  selectedSchedulePlatform: 'Google',
  selectedScheduleDay: 'mon' as DayKey,
  text,
  setRulePlatform: vi.fn(),
  setRuleStartHour: vi.fn(),
  setRuleEndHour: vi.fn(),
  setRuleAction: vi.fn(),
  setRuleMinRoas: vi.fn(),
  setRuleReason: vi.fn(),
  setSelectedSchedulePlatform: vi.fn(),
  setSelectedScheduleDay: vi.fn(),
  formatHour: (h: number) => `${h}:00`,
  formatHourRange: (s: number, e: number) => `${s}:00–${e}:00`,
  getActiveSlotsCount: vi.fn(() => 0),
  isFullDaySelected: vi.fn(() => false),
  addTimeRule: vi.fn(),
  removeTimeRule: vi.fn(),
  toggleFullDay: vi.fn(),
  toggleScheduleHour: vi.fn(),
  syncScheduleToAllSelectedPlatforms: vi.fn(),
  syncScheduleHint: 'Copies from current tab to all platforms.',
  syncScheduleButton: 'Copy schedule to all platforms',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CampaignSchedulePanel', () => {
  it('renders the timing rules section heading', () => {
    render(<CampaignSchedulePanel {...baseProps} />);
    expect(screen.getByText('Timing Rules')).toBeTruthy();
  });

  it('renders AI recommended hours for connected platforms', () => {
    render(<CampaignSchedulePanel {...baseProps} />);
    // Google has hours [9, 10] → formatHour renders "9:00 · 10:00"
    expect(screen.getAllByText(/9:00/).length).toBeGreaterThan(0);
  });

  it('shows "not enough data" for platform without recommendation hours', () => {
    render(<CampaignSchedulePanel {...baseProps} />);
    expect(screen.getByText(/Not enough hourly data/)).toBeTruthy();
  });

  it('calls addTimeRule when Add Rule button is clicked', () => {
    const addTimeRule = vi.fn();
    render(<CampaignSchedulePanel {...baseProps} addTimeRule={addTimeRule} />);
    fireEvent.click(screen.getByText('Add Rule'));
    expect(addTimeRule).toHaveBeenCalledOnce();
  });

  it('renders existing time rules', () => {
    render(
      <CampaignSchedulePanel
        {...baseProps}
        timeRules={[makeRule('rule-1')]}
        formatHourRange={() => '9:00–17:00'}
      />
    );
    expect(screen.getAllByText(/Google/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/9:00–17:00/).length).toBeGreaterThan(0);
    expect(screen.getByText(/morning/)).toBeTruthy();
  });

  it('calls removeTimeRule when trash button is clicked on a rule', () => {
    const removeTimeRule = vi.fn();
    render(
      <CampaignSchedulePanel
        {...baseProps}
        timeRules={[makeRule('rule-abc')]}
        removeTimeRule={removeTimeRule}
      />
    );
    // Find the trash button (svg icon button inside the rule row)
    const trashBtns = screen.getAllByRole('button').filter((b) =>
      b.querySelector('svg')
    );
    // The last one is likely the trash for the rule
    fireEvent.click(trashBtns[trashBtns.length - 1]);
    expect(removeTimeRule).toHaveBeenCalledWith('rule-abc');
  });

  it('calls setRuleStartHour when start hour select changes', () => {
    const setRuleStartHour = vi.fn();
    render(<CampaignSchedulePanel {...baseProps} setRuleStartHour={setRuleStartHour} />);
    const selects = screen.getAllByRole('combobox');
    // Second select is the start hour select
    fireEvent.change(selects[1], { target: { value: '10' } });
    expect(setRuleStartHour).toHaveBeenCalledWith(10);
  });

  it('calls setRuleEndHour when end hour select changes', () => {
    const setRuleEndHour = vi.fn();
    render(<CampaignSchedulePanel {...baseProps} setRuleEndHour={setRuleEndHour} />);
    const selects = screen.getAllByRole('combobox');
    // Third select is the end hour select
    fireEvent.change(selects[2], { target: { value: '17' } });
    expect(setRuleEndHour).toHaveBeenCalledWith(17);
  });
});
