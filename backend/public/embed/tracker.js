/**
 * Sea Hawk Courier — Embeddable Tracking Widget
 *
 * Usage (add to any website):
 *   <div id="seahawk-tracker"></div>
 *   <script src="https://your-domain.com/embed/tracker.js" data-container="seahawk-tracker"></script>
 *
 * Options (data attributes on the script tag):
 *   data-container   — ID of the container div (default: "seahawk-tracker")
 *   data-theme       — "light" or "dark" (default: "light")
 *   data-brand-color — hex color for the button (default: "#e8580a")
 *   data-awb         — pre-fill an AWB number
 */
(function () {
  'use strict';

  const script    = document.currentScript;
  const containerId  = script?.getAttribute('data-container') || 'seahawk-tracker';
  const theme        = script?.getAttribute('data-theme')     || 'light';
  const brandColor   = script?.getAttribute('data-brand-color') || '#e8580a';
  const prefillAWB   = script?.getAttribute('data-awb')       || '';
  const API_BASE     = script?.src ? new URL(script.src).origin : 'https://seahawk-courierfullstack-production.up.railway.app';

  const isDark = theme === 'dark';
  const bg     = isDark ? '#1a2b3c' : '#ffffff';
  const fg     = isDark ? '#f0f4f8' : '#1a202c';
  const border = isDark ? '#2d3d4e' : '#e2e8f0';
  const subFg  = isDark ? '#94a3b8' : '#64748b';
  const inputBg = isDark ? '#243447' : '#f8fafc';

  const STATUS_COLORS = {
    Delivered:       '#16a34a',
    InTransit:       '#2563eb',
    OutForDelivery:  '#d97706',
    Booked:          '#6366f1',
    Delayed:         '#dc2626',
    RTO:             '#dc2626',
    Cancelled:       '#6b7280',
  };

  function injectStyles() {
    if (document.getElementById('seahawk-widget-styles')) return;
    const style = document.createElement('style');
    style.id = 'seahawk-widget-styles';
    style.textContent = `
      .shw-root { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; box-sizing: border-box; }
      .shw-root *, .shw-root *::before, .shw-root *::after { box-sizing: inherit; }
      .shw-card { background: ${bg}; border: 1px solid ${border}; border-radius: 12px; padding: 20px; max-width: 480px; }
      .shw-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
      .shw-logo { font-size: 22px; }
      .shw-title { font-size: 15px; font-weight: 700; color: ${fg}; }
      .shw-sub { font-size: 11px; color: ${subFg}; }
      .shw-row { display: flex; gap: 8px; margin-bottom: 12px; }
      .shw-input { flex: 1; padding: 10px 12px; border: 1px solid ${border}; border-radius: 8px; background: ${inputBg}; color: ${fg}; font-size: 14px; outline: none; }
      .shw-input:focus { border-color: ${brandColor}; }
      .shw-btn { padding: 10px 18px; background: ${brandColor}; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; white-space: nowrap; }
      .shw-btn:hover { opacity: 0.9; }
      .shw-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .shw-error { color: #dc2626; font-size: 12px; margin-bottom: 10px; padding: 8px 12px; background: #fef2f2; border-radius: 6px; }
      .shw-result { border-top: 1px solid ${border}; padding-top: 14px; margin-top: 4px; }
      .shw-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
      .shw-meta-item { }
      .shw-meta-label { font-size: 11px; color: ${subFg}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
      .shw-meta-value { font-size: 13px; font-weight: 600; color: ${fg}; }
      .shw-status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; color: #fff; }
      .shw-timeline { }
      .shw-timeline-title { font-size: 11px; font-weight: 700; color: ${subFg}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
      .shw-event { display: flex; gap: 10px; padding-bottom: 10px; }
      .shw-event-line { display: flex; flex-direction: column; align-items: center; }
      .shw-event-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
      .shw-event-connector { width: 1px; flex: 1; margin-top: 3px; background: ${border}; }
      .shw-event-body { flex: 1; padding-bottom: 2px; }
      .shw-event-status { font-size: 13px; font-weight: 600; color: ${fg}; }
      .shw-event-detail { font-size: 11px; color: ${subFg}; margin-top: 1px; }
      .shw-footer { margin-top: 14px; padding-top: 10px; border-top: 1px solid ${border}; display: flex; align-items: center; justify-content: space-between; }
      .shw-footer-brand { font-size: 11px; color: ${subFg}; }
      .shw-footer-link { font-size: 11px; color: ${brandColor}; text-decoration: none; font-weight: 600; }
    `;
    document.head.appendChild(style);
  }

  function render(container, html) {
    container.innerHTML = html;
  }

  function buildWidget(container) {
    injectStyles();

    container.innerHTML = `
      <div class="shw-root">
        <div class="shw-card">
          <div class="shw-header">
            <span class="shw-logo">🦅</span>
            <div>
              <div class="shw-title">Track Your Shipment</div>
              <div class="shw-sub">Sea Hawk Courier & Cargo</div>
            </div>
          </div>
          <div class="shw-row">
            <input class="shw-input" id="shw-awb-input" placeholder="Enter AWB / Tracking Number" value="${prefillAWB}" />
            <button class="shw-btn" id="shw-track-btn">Track</button>
          </div>
          <div id="shw-error" style="display:none" class="shw-error"></div>
          <div id="shw-result" style="display:none" class="shw-result"></div>
          <div class="shw-footer">
            <span class="shw-footer-brand">Powered by Sea Hawk</span>
            <a class="shw-footer-link" href="${API_BASE}/track" target="_blank">Full tracker →</a>
          </div>
        </div>
      </div>
    `;

    const input  = container.querySelector('#shw-awb-input');
    const btn    = container.querySelector('#shw-track-btn');
    const error  = container.querySelector('#shw-error');
    const result = container.querySelector('#shw-result');

    async function doTrack() {
      const awb = input.value.trim().toUpperCase();
      if (!awb) return;
      btn.disabled = true;
      btn.textContent = '...';
      error.style.display = 'none';
      result.style.display = 'none';

      try {
        const res = await fetch(`${API_BASE}/api/public/track/${encodeURIComponent(awb)}`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Shipment not found');

        const s      = data.data?.shipment || data.data || {};
        const events = data.data?.events   || [];
        const color  = STATUS_COLORS[s.status] || '#6b7280';

        const eventsHTML = events.slice(0, 5).map((ev, i) => `
          <div class="shw-event">
            <div class="shw-event-line">
              <div class="shw-event-dot" style="background:${i === 0 ? brandColor : border}"></div>
              ${i < Math.min(events.length, 5) - 1 ? '<div class="shw-event-connector"></div>' : ''}
            </div>
            <div class="shw-event-body">
              <div class="shw-event-status">${ev.status || ''}</div>
              <div class="shw-event-detail">${ev.location ? ev.location + ' · ' : ''}${ev.timestamp ? new Date(ev.timestamp).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : ''}</div>
              ${ev.description ? `<div class="shw-event-detail">${ev.description}</div>` : ''}
            </div>
          </div>
        `).join('');

        result.style.display = 'block';
        result.innerHTML = `
          <div class="shw-meta">
            <div class="shw-meta-item"><div class="shw-meta-label">AWB</div><div class="shw-meta-value" style="font-family:monospace">${s.awb || awb}</div></div>
            <div class="shw-meta-item"><div class="shw-meta-label">Status</div><div><span class="shw-status-badge" style="background:${color}">${s.status || 'Unknown'}</span></div></div>
            <div class="shw-meta-item"><div class="shw-meta-label">Consignee</div><div class="shw-meta-value">${s.consignee || '—'}</div></div>
            <div class="shw-meta-item"><div class="shw-meta-label">Destination</div><div class="shw-meta-value">${s.destination || '—'}</div></div>
            <div class="shw-meta-item"><div class="shw-meta-label">Courier</div><div class="shw-meta-value">${s.courier || '—'}</div></div>
            <div class="shw-meta-item"><div class="shw-meta-label">Weight</div><div class="shw-meta-value">${s.weight ? s.weight + ' kg' : '—'}</div></div>
          </div>
          ${events.length > 0 ? `<div class="shw-timeline"><div class="shw-timeline-title">Tracking Timeline</div>${eventsHTML}</div>` : ''}
        `;
      } catch (err) {
        error.textContent = err.message || 'Tracking failed. Please try again.';
        error.style.display = 'block';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Track';
      }
    }

    btn.addEventListener('click', doTrack);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') doTrack(); });

    // Auto-track if AWB pre-filled
    if (prefillAWB) doTrack();
  }

  // Init on DOMContentLoaded or immediately if already loaded
  function init() {
    const container = document.getElementById(containerId);
    if (container) {
      buildWidget(container);
    } else {
      console.warn(`[SeaHawk Widget] Container #${containerId} not found.`);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
