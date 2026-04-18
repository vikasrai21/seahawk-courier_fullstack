import { cropRectForCoverVideo } from './videoCoverCrop.js';

export function describeCaptureIssues(issues = []) {
  if (!issues.length) return '';
  const labels = [];
  if (issues.includes('blur')) labels.push('hold steady');
  if (issues.includes('glare')) labels.push('reduce glare');
  if (issues.includes('angle')) labels.push('straighten angle');
  if (issues.includes('dark')) labels.push('add light');
  if (issues.includes('low_edge')) labels.push('fill frame');
  if (!labels.length) return '';
  return `Improve capture: ${labels.join(', ')}.`;
}

export function analyzeCaptureQuality(video, guide) {
  if (!video || !guide || !video.videoWidth || !video.videoHeight) return null;
  const crop = cropRectForCoverVideo(video, guide);
  if (!crop) return null;

  const sx = Math.max(0, Math.floor(crop.x));
  const sy = Math.max(0, Math.floor(crop.y));
  const sw = Math.max(24, Math.floor(crop.w));
  const sh = Math.max(24, Math.floor(crop.h));

  const sampleW = 128;
  const sampleH = 96;
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = sampleW;
  sampleCanvas.height = sampleH;
  const ctx = sampleCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(
    video,
    sx,
    sy,
    Math.min(sw, video.videoWidth - sx),
    Math.min(sh, video.videoHeight - sy),
    0,
    0,
    sampleW,
    sampleH
  );
  const pixels = ctx.getImageData(0, 0, sampleW, sampleH).data;

  const total = sampleW * sampleH;
  const lum = new Float32Array(total);
  let sumLum = 0;
  let brightPixels = 0;
  let darkPixels = 0;
  for (let i = 0, p = 0; i < pixels.length; i += 4, p += 1) {
    const luminance = 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
    lum[p] = luminance;
    sumLum += luminance;
    if (luminance >= 245) brightPixels += 1;
    if (luminance <= 24) darkPixels += 1;
  }

  let laplacianEnergy = 0;
  let edgeCount = 0;
  let topEdge = 0;
  let bottomEdge = 0;
  let leftEdge = 0;
  let rightEdge = 0;
  const borderBandY = Math.max(4, Math.floor(sampleH * 0.15));
  const borderBandX = Math.max(4, Math.floor(sampleW * 0.15));
  const cols = sampleW;

  for (let y = 1; y < sampleH - 1; y += 1) {
    for (let x = 1; x < sampleW - 1; x += 1) {
      const idx = y * cols + x;
      const c = lum[idx];
      const l = lum[idx - 1];
      const r = lum[idx + 1];
      const t = lum[idx - cols];
      const b = lum[idx + cols];
      const gx = Math.abs(r - l);
      const gy = Math.abs(b - t);
      const edgeStrength = gx + gy;
      const lap = Math.abs((4 * c) - l - r - t - b);
      laplacianEnergy += lap;
      if (edgeStrength > 58) edgeCount += 1;

      if (y <= borderBandY) topEdge += edgeStrength;
      if (y >= sampleH - borderBandY) bottomEdge += edgeStrength;
      if (x <= borderBandX) leftEdge += edgeStrength;
      if (x >= sampleW - borderBandX) rightEdge += edgeStrength;
    }
  }

  const coreTotal = Math.max(1, (sampleW - 2) * (sampleH - 2));
  const brightness = sumLum / total;
  const blurScore = laplacianEnergy / coreTotal;
  const edgeRatio = edgeCount / coreTotal;
  const glareRatio = brightPixels / total;
  const darkRatio = darkPixels / total;
  const tbSkew = Math.abs(topEdge - bottomEdge) / Math.max(1, topEdge + bottomEdge);
  const lrSkew = Math.abs(leftEdge - rightEdge) / Math.max(1, leftEdge + rightEdge);
  const perspectiveSkew = Math.max(tbSkew, lrSkew);

  const issues = [];
  if (blurScore < 22) issues.push('blur');
  if (glareRatio > 0.18) issues.push('glare');
  if (darkRatio > 0.55 || brightness < 40) issues.push('dark');
  if (edgeRatio < 0.08) issues.push('low_edge');
  if (perspectiveSkew > 0.62) issues.push('angle');

  return {
    ok: issues.length === 0,
    issues,
    metrics: {
      brightness: Number(brightness.toFixed(1)),
      blurScore: Number(blurScore.toFixed(1)),
      glareRatio: Number((glareRatio * 100).toFixed(1)),
      edgeRatio: Number((edgeRatio * 100).toFixed(1)),
      perspectiveSkew: Number((perspectiveSkew * 100).toFixed(1)),
    },
  };
}

