// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

afterEach(cleanup);
import { CampaignPlatformCopy } from '../../src/views/campaigns/CampaignPlatformCopy';
import type { PlatformName, PlatformCopyDraft } from '../../src/views/campaigns/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const text = {
  platformCopyTitle: 'Platform Copy',
  platformCopySubtitle: 'Customize per platform',
  applyPlatformCopy: 'Apply',
  previewNoText: 'No text yet',
};

const makeDraft = (title = '', description = ''): PlatformCopyDraft => ({ title, description });

const defaultProps = {
  isHebrew: false,
  draftPlatforms: ['Google', 'Meta'] as PlatformName[],
  selectedCopyPlatform: 'Google',
  platformCopyDrafts: {
    Google: makeDraft('Buy Now', 'Great deals on Google'),
    Meta: makeDraft('', ''),
  } as Partial<Record<PlatformName, PlatformCopyDraft>>,
  text,
  getPlatformTitleLimit: (_p: PlatformName) => 30,
  getPlatformDescriptionLimit: (_p: PlatformName) => 90,
  setSelectedCopyPlatform: vi.fn(),
  setPlatformCopyDrafts: vi.fn(),
  applyPlatformCopyToFields: vi.fn(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CampaignPlatformCopy', () => {
  it('renders null when draftPlatforms is empty', () => {
    const { container } = render(
      <CampaignPlatformCopy {...defaultProps} draftPlatforms={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders a tab button for each platform', () => {
    render(<CampaignPlatformCopy {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    const labels = buttons.map((b) => b.textContent);
    expect(labels.some((l) => l?.includes('Google'))).toBe(true);
    expect(labels.some((l) => l?.includes('Meta'))).toBe(true);
  });

  it('renders the section heading', () => {
    render(<CampaignPlatformCopy {...defaultProps} />);
    expect(screen.getByText('Platform Copy')).toBeTruthy();
  });

  it('calls setSelectedCopyPlatform when a tab is clicked', () => {
    const setSelectedCopyPlatform = vi.fn();
    render(
      <CampaignPlatformCopy {...defaultProps} setSelectedCopyPlatform={setSelectedCopyPlatform} />
    );
    const metaBtn = screen.getAllByRole('button').find((b) => b.textContent?.startsWith('Meta'));
    fireEvent.click(metaBtn!);
    expect(setSelectedCopyPlatform).toHaveBeenCalledWith('Meta');
  });

  it('shows draft title and description for selected platform', () => {
    render(<CampaignPlatformCopy {...defaultProps} />);
    expect(screen.getAllByDisplayValue('Buy Now').length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue('Great deals on Google').length).toBeGreaterThan(0);
  });

  it('shows apply button and calls applyPlatformCopyToFields', () => {
    const applyPlatformCopyToFields = vi.fn();
    render(
      <CampaignPlatformCopy {...defaultProps} applyPlatformCopyToFields={applyPlatformCopyToFields} />
    );
    fireEvent.click(screen.getByText('Apply'));
    expect(applyPlatformCopyToFields).toHaveBeenCalledWith('Google');
  });

  it('calls setPlatformCopyDrafts when title input changes', () => {
    const setPlatformCopyDrafts = vi.fn();
    render(
      <CampaignPlatformCopy {...defaultProps} setPlatformCopyDrafts={setPlatformCopyDrafts} />
    );
    const [titleInput] = screen.getAllByDisplayValue('Buy Now');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    expect(setPlatformCopyDrafts).toHaveBeenCalled();
  });

  it('shows preview title in the preview panel', () => {
    render(<CampaignPlatformCopy {...defaultProps} />);
    // The preview pane shows the trimmed draft title
    const allBuyNow = screen.getAllByText('Buy Now');
    expect(allBuyNow.length).toBeGreaterThanOrEqual(1);
  });

  it('shows placeholder text in preview when title is empty', () => {
    render(
      <CampaignPlatformCopy
        {...defaultProps}
        platformCopyDrafts={{ Google: makeDraft('', '') }}
      />
    );
    expect(screen.getByText('Ad headline')).toBeTruthy();
  });
});
