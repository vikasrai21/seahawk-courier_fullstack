'use strict';

export function normalizeBarcodeCandidate(rawValue = '') {
  const raw = String(rawValue || '').toUpperCase();
  const compact = raw.replace(/\s+/g, '');
  const candidates = [];

  const push = (value) => {
    const normalized = String(value || '').replace(/[^A-Z0-9]/g, '');
    if (!normalized || candidates.includes(normalized)) return;
    candidates.push(normalized);
  };

  push(compact);
  (raw.match(/\b\d{12,14}\b/g) || []).forEach(push);
  (raw.match(/\b[A-Z]{1,2}\d{8,11}\b/g) || []).forEach(push);

  candidates.forEach((candidate) => {
    if (/^0\d{12}$/.test(candidate)) push(candidate.slice(1));
  });

  const prioritized = [
    ...candidates.filter((value) => /^[125]\d{11}$/.test(value)),
    ...candidates.filter((value) => /^\d{12}$/.test(value)),
    ...candidates.filter((value) => /^\d{13,14}$/.test(value)),
    ...candidates.filter((value) => /^[A-Z]{1,2}\d{8,11}$/.test(value)),
    ...candidates,
  ];

  return prioritized.find(Boolean) || '';
}
