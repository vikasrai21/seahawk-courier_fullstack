/* =========================================================
   main.js — Sea Hawk Courier v5
   Counters, navigation, tracking, quote, animations
   ========================================================= */

/* ── MOBILE MENU ── */
function mobOpen()  { document.getElementById('mobMenu').classList.add('open'); document.body.style.overflow='hidden'; }
function mobClose() { document.getElementById('mobMenu').classList.remove('open'); document.body.style.overflow=''; }

/* ── TAB SWITCHER ── */
function switchTab(panelId, btn) {
  document.querySelectorAll('.tw-tab').forEach(b => b.classList.remove('on'));
  document.querySelectorAll('.tw-panel').forEach(p => p.classList.remove('on'));
  btn.classList.add('on');
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add('on');
}

/* ── SHIPMENT TRACKER ── */
function doTrack() {
  const awbInput = document.getElementById('awb-input');
  if (!awbInput) return;
  const awb = awbInput.value.trim();
  if (!awb) { awbInput.focus(); return; }
  document.getElementById('tr-awb-val').textContent = awb.toUpperCase();
  const steps = [
    { label:'Shipment Booked & Collected', sub:'Delhi — Seahawk Origin Hub', done:true  },
    { label:'Departed Origin Hub',         sub:'Delhi International Gateway', done:true  },
    { label:'In Transit — Carrier Network',sub:'En route to destination',    active:true },
    { label:'Arrived at Destination Hub',  sub:'Awaiting delivery',          pend:true   },
    { label:'Out for Delivery',            sub:'Expected today',             pend:true   },
  ];
  document.getElementById('tr-steps').innerHTML = steps.map((s,i) => `
    <div class="tr-step">
      <div class="tr-sl">
        <div class="tr-dot ${s.done ? 'done' : s.pend ? 'pend' : ''}"></div>
        ${i < steps.length-1 ? '<div class="tr-line"></div>' : ''}
      </div>
      <div>
        <div class="tr-loc ${s.pend ? 'pend' : ''}">${s.label}</div>
        <div class="tr-sub">${s.sub}</div>
      </div>
    </div>`).join('');
  const result = document.getElementById('trackResult');
  if (result) { result.classList.add('show'); result.scrollIntoView({ behavior:'smooth', block:'nearest' }); }
}

/* ── QUICK QUOTE ── */
const QR = {
  dom:  { local:30, metro:60, roi:70, ne:90 },
  intl: { local:1200, metro:1800, roi:2200, ne:2400 },
  b2b:  { local:15, metro:25, roi:35, ne:50 },
};
function quickQuote() {
  const wt = parseFloat(document.getElementById('qq-wt')?.value) || 0;
  if (!wt) { alert('Please enter a weight.'); return; }
  const svc  = document.getElementById('qq-svc')?.value  || 'dom';
  const dest = document.getElementById('qq-dest')?.value || 'local';
  const base = (QR[svc] || QR.dom)[dest] || 60;
  const total = (base + Math.max(0,(wt/1000)-0.5)*base*1.1) * 1.27 * 1.18;
  const el  = document.getElementById('qq-res');
  const val = document.getElementById('qq-val');
  if (el && val) { val.textContent = '₹'+Math.round(total); el.style.display = 'block'; }
}

/* ── CALLBACK REQUEST ── */
function doCallback() {
  const name  = document.getElementById('cb-name')?.value.trim();
  const phone = document.getElementById('cb-phone')?.value.trim();
  if (!name || !phone) { alert('Please fill in your name and phone number.'); return; }
  window.open(`https://wa.me/919911565523?text=${encodeURIComponent('Hi! Callback request.\nName: '+name+'\nPhone: '+phone)}`, '_blank');
  const ok = document.getElementById('cb-ok');
  if (ok) { ok.style.display = 'block'; setTimeout(() => ok.style.display = 'none', 5000); }
}

/* ── CONTACT FORM ── */
function sendContact() {
  const name    = document.getElementById('cf-name')?.value.trim();
  const contact = document.getElementById('cf-contact')?.value.trim();
  const subj    = document.getElementById('cf-subj')?.value;
  const msg     = document.getElementById('cf-msg')?.value.trim();
  if (!name || !contact) { alert('Please fill in your name and contact details.'); return; }
  const text = `Hi Sea Hawk!\n\nName: ${name}\nContact: ${contact}\nSubject: ${subj}\nMessage: ${msg||'—'}`;
  window.open(`https://wa.me/919911565523?text=${encodeURIComponent(text)}`, '_blank');
  const ok = document.getElementById('cf-ok');
  if (ok) { ok.style.display='block'; setTimeout(()=>ok.style.display='none',5000); }
}

/* ══════════════════════════════════════════
   COUNTER ANIMATION — Odometer-style
   Numbers count up with easing when scrolled into view
══════════════════════════════════════════ */
function animateCounter(el, target, suffix, duration = 2200) {
  const isLarge = target >= 1000;
  let start = null;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    // Ease out cubic for satisfying deceleration
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    // Format large numbers with K
    if (isLarge && target >= 100000) {
      el.textContent = (current/1000).toFixed(current < 10000 ? 1 : 0) + 'K';
    } else if (isLarge) {
      el.textContent = current.toLocaleString('en-IN');
    } else {
      el.textContent = current;
    }
    if (progress < 1) requestAnimationFrame(step);
    else {
      // Final value formatting
      if (isLarge && target >= 100000) el.textContent = (target/1000).toFixed(0)+'K';
      else if (isLarge) el.textContent = target.toLocaleString('en-IN');
      else el.textContent = target;
    }
  };
  requestAnimationFrame(step);
}

/* ── COUNTER OBSERVER ── */
const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el     = e.target;
    const target = parseInt(el.dataset.t);
    const dur    = parseInt(el.dataset.dur || '2200');
    animateCounter(el, target, '', dur);
    counterObs.unobserve(el);
  });
}, { threshold: 0.3 });

/* ── SCROLL REVEAL ── */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
}, { threshold: 0.07 });

/* ══════════════════════════════════════════
   DOM READY — Initialise everything
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Counters
  document.querySelectorAll('.count').forEach(el => counterObs.observe(el));

  // Scroll reveal
  document.querySelectorAll('.rev').forEach(el => revealObs.observe(el));

  // AWB enter key
  const awbIn = document.getElementById('awb-input');
  if (awbIn) awbIn.addEventListener('keydown', e => { if (e.key === 'Enter') doTrack(); });

  // Smooth anchor scrolling
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior:'smooth', block:'start' }); }
    });
  });
});

/* ── GO TO TRACK PAGE ─────────────────────────────────────── */
function goToTrack() {
  const awb = (document.getElementById('awb-input')?.value || '').trim();
  if (!awb) { document.getElementById('awb-input')?.focus(); return; }
  window.location.href = 'track.html?awb=' + encodeURIComponent(awb);
}
