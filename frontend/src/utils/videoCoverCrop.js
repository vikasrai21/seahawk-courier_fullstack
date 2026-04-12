export function cropRectForCoverVideo(videoEl, guideEl) {
  try {
    if (!videoEl || !guideEl) return null;

    const videoWidth = Number(videoEl.videoWidth || 0);
    const videoHeight = Number(videoEl.videoHeight || 0);
    if (!videoWidth || !videoHeight) return null;

    const videoRect = videoEl.getBoundingClientRect?.();
    const guideRect = guideEl.getBoundingClientRect?.();
    if (!videoRect || !guideRect) return null;

    const elementWidth = Number(videoRect.width || 0);
    const elementHeight = Number(videoRect.height || 0);
    if (!elementWidth || !elementHeight) return null;

    // object-fit: cover mapping
    const scale = Math.max(elementWidth / videoWidth, elementHeight / videoHeight);
    const displayWidth = videoWidth * scale;
    const displayHeight = videoHeight * scale;
    const offsetX = (elementWidth - displayWidth) / 2;
    const offsetY = (elementHeight - displayHeight) / 2;

    const leftInEl = guideRect.left - videoRect.left;
    const topInEl = guideRect.top - videoRect.top;
    const rightInEl = guideRect.right - videoRect.left;
    const bottomInEl = guideRect.bottom - videoRect.top;

    const x1 = (leftInEl - offsetX) / scale;
    const y1 = (topInEl - offsetY) / scale;
    const x2 = (rightInEl - offsetX) / scale;
    const y2 = (bottomInEl - offsetY) / scale;

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const x = clamp(Math.min(x1, x2), 0, videoWidth);
    const y = clamp(Math.min(y1, y2), 0, videoHeight);
    const r = clamp(Math.max(x1, x2), 0, videoWidth);
    const b = clamp(Math.max(y1, y2), 0, videoHeight);

    const w = Math.max(0, r - x);
    const h = Math.max(0, b - y);
    if (!w || !h) return null;

    return { x, y, w, h };
  } catch {
    return null;
  }
}

