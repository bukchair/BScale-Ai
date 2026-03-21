// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaAssets } from '../../src/views/campaigns/useMediaAssets';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeFile = (name: string, size: number, type: string): File => {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], name, { type });
};

const defaultLimits = {
  imageMaxMb: 5,
  videoMaxMb: 100,
  maxImageWidth: 1200,
  maxImageHeight: 1200,
};

const defaultProps = {
  effectiveMediaLimits: defaultLimits,
  isHebrew: false,
  onMessage: vi.fn(),
};

// jsdom doesn't implement URL.createObjectURL; stub it
beforeEach(() => {
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:stub'),
    revokeObjectURL: vi.fn(),
  });
});

// Helper: fire a synthetic file input change event
const fireUpload = async (
  handleAssetUpload: (e: React.ChangeEvent<HTMLInputElement>) => void,
  files: File[]
) => {
  const input = document.createElement('input');
  Object.defineProperty(input, 'files', { value: files });
  const event = { target: input } as unknown as React.ChangeEvent<HTMLInputElement>;
  await act(async () => {
    await handleAssetUpload(event);
  });
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useMediaAssets', () => {
  it('initializes with empty uploadedAssets', () => {
    const { result } = renderHook(() => useMediaAssets(defaultProps));
    expect(result.current.uploadedAssets).toEqual([]);
  });

  it('handleAssetUpload ignores non-image/video files', async () => {
    const onMessage = vi.fn();
    const { result } = renderHook(() =>
      useMediaAssets({ ...defaultProps, onMessage })
    );
    const txtFile = makeFile('doc.txt', 100, 'text/plain');
    await fireUpload(result.current.handleAssetUpload, [txtFile]);
    expect(result.current.uploadedAssets).toHaveLength(0);
    expect(onMessage).not.toHaveBeenCalled();
  });

  it('handleAssetUpload rejects oversized image and calls onMessage', async () => {
    const onMessage = vi.fn();
    const limits = { ...defaultLimits, imageMaxMb: 1 };
    const { result } = renderHook(() =>
      useMediaAssets({ effectiveMediaLimits: limits, isHebrew: false, onMessage })
    );
    // 2 MB > 1 MB limit
    const bigImg = makeFile('big.jpg', 2 * 1024 * 1024, 'image/jpeg');
    // Stub Image so resizeImageForPlatforms won't hang
    vi.stubGlobal('Image', class {
      onload: (() => void) | null = null;
      set src(_: string) { this.onload?.(); }
      width = 100; height = 100;
    });
    await fireUpload(result.current.handleAssetUpload, [bigImg]);
    expect(result.current.uploadedAssets).toHaveLength(0);
    expect(onMessage).toHaveBeenCalledWith(expect.stringContaining('big.jpg'));
  });

  it('handleAssetUpload rejects oversized video and calls onMessage', async () => {
    const onMessage = vi.fn();
    const limits = { ...defaultLimits, videoMaxMb: 10 };
    const { result } = renderHook(() =>
      useMediaAssets({ effectiveMediaLimits: limits, isHebrew: false, onMessage })
    );
    const bigVideo = makeFile('clip.mp4', 20 * 1024 * 1024, 'video/mp4');
    await fireUpload(result.current.handleAssetUpload, [bigVideo]);
    expect(result.current.uploadedAssets).toHaveLength(0);
    expect(onMessage).toHaveBeenCalledWith(expect.stringContaining('clip.mp4'));
  });

  it('handleAssetUpload adds a valid video asset', async () => {
    const onMessage = vi.fn();
    const { result } = renderHook(() =>
      useMediaAssets({ ...defaultProps, onMessage })
    );
    const video = makeFile('ad.mp4', 1024, 'video/mp4');
    await fireUpload(result.current.handleAssetUpload, [video]);
    expect(result.current.uploadedAssets).toHaveLength(1);
    expect(result.current.uploadedAssets[0].mediaType).toBe('video');
    expect(result.current.uploadedAssets[0].name).toBe('ad.mp4');
    expect(onMessage).toHaveBeenCalledWith(null);
  });

  it('removeAsset removes the correct asset by id', async () => {
    const { result } = renderHook(() => useMediaAssets(defaultProps));
    const video = makeFile('v.mp4', 512, 'video/mp4');
    await fireUpload(result.current.handleAssetUpload, [video]);
    const id = result.current.uploadedAssets[0].id;
    act(() => { result.current.removeAsset(id); });
    expect(result.current.uploadedAssets).toHaveLength(0);
  });

  it('clearUploadedMedia empties the asset list', async () => {
    const { result } = renderHook(() => useMediaAssets(defaultProps));
    const v1 = makeFile('a.mp4', 512, 'video/mp4');
    const v2 = makeFile('b.mp4', 512, 'video/mp4');
    await fireUpload(result.current.handleAssetUpload, [v1]);
    await fireUpload(result.current.handleAssetUpload, [v2]);
    act(() => { result.current.clearUploadedMedia(); });
    expect(result.current.uploadedAssets).toHaveLength(0);
  });

  it('caps uploadedAssets at 12 items', async () => {
    const { result } = renderHook(() => useMediaAssets(defaultProps));
    for (let i = 0; i < 14; i++) {
      const v = makeFile(`v${i}.mp4`, 100, 'video/mp4');
      // eslint-disable-next-line no-await-in-loop
      await fireUpload(result.current.handleAssetUpload, [v]);
    }
    expect(result.current.uploadedAssets.length).toBeLessThanOrEqual(12);
  });
});
