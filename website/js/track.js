/* ============================================================
   track.js — Sea Hawk Courier & Cargo
   
   Enter AWB → shows all 6 carrier buttons → user picks theirs.
   Zero guessing. Always correct.
   ============================================================ */

'use strict';

const CARRIERS = [
  {
    name:    'Delhivery',
    icon:    '🚀',
    color:   '#E62B4A',
    primary: true,
    url:     awb => `https://www.delhivery.com/track/package/${awb}`,
  },
  {
    name:    'DTDC',
    icon:    '📦',
    color:   '#B71C1C',
    primary: true,
    url:     awb => `https://www.dtdc.in/tracking/tracking.asp?TrkType=awb&strCNNo=${awb}`,
  },
  {
    name:    'Trackon / PrimeTrack',
    icon:    '🟠',
    color:   '#E65100',
    primary: true,
    url:     awb => `https://www.trackoncourier.com/tracking?trackingId=${awb}`,
  },
  {
    name:    'BlueDart',
    icon:    '🔵',
    color:   '#003087',
    primary: false,
    url:     awb => `https://www.bluedart.com/tracking?trackFor=0&track=awb&trackNo=${awb}`,
  },
  {
    name:    'FedEx',
    icon:    '🟣',
    color:   '#4D148C',
    primary: false,
    url:     awb => `https://www.fedex.com/fedextrack/?trknbr=${awb}`,
  },
  {
    name:    'DHL Express',
    icon:    '🟡',
    color:   '#D40511',
    primary: false,
    url:     awb => `https://www.dhl.com/en/express/tracking.html?AWB=${awb}`,
  },
];

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, m =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

function showState(name) {
  ['Idle','Loading','Error','Result'].forEach(n => {
    const el = document.getElementById('state' + n);
    if (el) el.style.display = n.toLowerCase() === name ? 'block' : 'none';
  });
}

function showError(msg) {
  showState('error');
  const el = document.getElementById('errorMsg');
  if (el) el.innerHTML = msg;
}

function doTrack() {
  const inputEl = document.getElementById('trackInput');
  const awb     = (inputEl?.value || '').trim().replace(/\s+/g, '');

  if (!awb) {
    inputEl?.focus();
    return;
  }
  if (awb.length < 4) {
    showError('Please enter a valid AWB or docket number.');
    return;
  }

  /* Build the carrier buttons */
  const primaryButtons = CARRIERS.filter(c => c.primary).map(c => `
    <a href="${c.url(esc(awb))}" target="_blank" rel="noopener noreferrer" class="carrier-btn carrier-btn-primary">
      <span class="carrier-btn-icon">${c.icon}</span>
      <span class="carrier-btn-name">${c.name}</span>
      <span class="carrier-btn-arrow">→</span>
    </a>`).join('');

  const secondaryButtons = CARRIERS.filter(c => !c.primary).map(c => `
    <a href="${c.url(esc(awb))}" target="_blank" rel="noopener noreferrer" class="carrier-btn carrier-btn-secondary">
      <span class="carrier-btn-icon">${c.icon}</span>
      <span class="carrier-btn-name">${c.name}</span>
      <span class="carrier-btn-arrow">→</span>
    </a>`).join('');

  const html = `
  <div class="track-result-card" style="animation:fadeUp .25s ease;">

    <!-- AWB display -->
    <div class="tc-head">
      <div class="tc-head-top">
        <div>
          <div class="tc-carrier-name">Which carrier is this shipment with?</div>
          <div class="tc-awb">${esc(awb)}</div>
        </div>
      </div>
      <div style="margin-top:12px;font-size:.8rem;color:rgba(255,255,255,.6);">
        Check the label or your confirmation email, then tap your carrier below.
      </div>
    </div>

    <!-- Primary carriers (Delhivery, DTDC, Trackon) -->
    <div class="carrier-section">
      <div class="carrier-section-label">Main Carriers</div>
      <div class="carrier-grid">${primaryButtons}</div>
    </div>

    <!-- Secondary carriers -->
    <div class="carrier-section carrier-section-border">
      <div class="carrier-section-label">Other Carriers</div>
      <div class="carrier-grid carrier-grid-3">${secondaryButtons}</div>
    </div>

    <!-- WhatsApp fallback -->
    <div class="tc-wa-band">
      <h4>📱 Not sure which carrier?</h4>
      <p>WhatsApp Sea Hawk — we'll look it up and share the tracking link instantly.</p>
      <a class="tc-wa-btn"
        href="https://wa.me/919911565523?text=${encodeURIComponent('Hi Sea Hawk! Please share the tracking link for AWB: ' + awb)}"
        target="_blank" rel="noopener noreferrer">
        💬 WhatsApp Sea Hawk
      </a>
    </div>

  </div>`;

  const box = document.getElementById('stateResult');
  if (box) box.innerHTML = html;
  showState('result');
  box?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* Enter key support */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('trackInput')
    ?.addEventListener('keydown', e => { if (e.key === 'Enter') doTrack(); });

  /* URL param */
  const awb = new URL(window.location.href).searchParams.get('awb')
            || new URL(window.location.href).searchParams.get('track');
  if (awb) {
    const i = document.getElementById('trackInput');
    if (i) i.value = awb;
    setTimeout(doTrack, 300);
  }
});
