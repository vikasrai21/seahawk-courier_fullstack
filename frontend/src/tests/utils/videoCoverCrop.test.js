import { describe, it, expect } from 'vitest';
import { cropRectForCoverVideo } from '@/utils/videoCoverCrop.js';

function rect({ left, top, width, height }) {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}

describe('cropRectForCoverVideo', () => {
  it('maps linearly when element and video share aspect ratio', () => {
    const videoEl = {
      videoWidth: 1920,
      videoHeight: 1080,
      getBoundingClientRect: () => rect({ left: 0, top: 0, width: 1600, height: 900 }),
    };
    const guideEl = {
      getBoundingClientRect: () => rect({ left: 100, top: 50, width: 400, height: 200 }),
    };

    const crop = cropRectForCoverVideo(videoEl, guideEl);
    expect(crop).toBeTruthy();

    // scale = 1600/1920 = 0.833333...
    expect(crop.x).toBeCloseTo(120, 3);
    expect(crop.y).toBeCloseTo(60, 3);
    expect(crop.w).toBeCloseTo(480, 3);
    expect(crop.h).toBeCloseTo(240, 3);
  });

  it('accounts for object-fit: cover cropping (portrait element)', () => {
    const videoEl = {
      videoWidth: 1920,
      videoHeight: 1080,
      getBoundingClientRect: () => rect({ left: 0, top: 0, width: 360, height: 640 }),
    };
    const guideEl = {
      // full element guide
      getBoundingClientRect: () => rect({ left: 0, top: 0, width: 360, height: 640 }),
    };

    const crop = cropRectForCoverVideo(videoEl, guideEl);
    expect(crop).toBeTruthy();

    // Portrait element forces cover to crop the left/right sides of the 16:9 video.
    expect(crop.y).toBeCloseTo(0, 2);
    expect(crop.h).toBeCloseTo(1080, 2);
    expect(crop.x).toBeGreaterThan(0);
    expect(crop.w).toBeLessThan(1920);
  });
});

