import { memo } from 'react';
import {
  Check, X, Shield, Package, CalendarDays, RefreshCw, RotateCcw,
} from 'lucide-react';

/**
 * ReviewPanel — The main review form with swipe gestures and field editing.
 * This is the largest sub-component (~260 lines), extracted from lines 2998-3259.
 * All state setters and callbacks are passed as props from the parent.
 */
export const ReviewPanel = memo(function ReviewPanel({
  stepClass,
  STEPS,
  step,
  theme,
  // Data
  reviewData,
  reviewForm,
  setReviewForm,
  lockedAwb,
  reviewCourier,
  inferredCourier,
  intelligence,
  reviewConfidence,
  fieldConfidence,
  stickyClientCode,
  setStickyClientCode,
  reviewDateLabel,
  // Swipe
  swipeProgress,
  handleSwipeTouchStart,
  handleSwipeTouchMove,
  handleSwipeTouchEnd,
  // Helpers
  confDotClass,
  sourceLabel,
  normalizeClientCode,
  lookupPincodeCity,
  pulseHaptic,
  cycleReviewCourier,
  copyAwb,
  awbCopied,
  // Actions
  submitApproval,
  resetForNextScan,
  isStandalone,
  navigate,
}) {
  return (
    <div className={stepClass(STEPS.REVIEWING)}>
      <div className="review-swipe-root"
        onTouchStart={handleSwipeTouchStart}
        onTouchMove={handleSwipeTouchMove}
        onTouchEnd={handleSwipeTouchEnd}
      >
        {/* Swipe overlays */}
        <div className="swipe-action-overlay approve" style={{ opacity: Math.max(0, swipeProgress) * 1.1 }}>
          <div className="swipe-action-label">
            <Check size={44} color="white" strokeWidth={3} />
            APPROVE
          </div>
        </div>
        <div className="swipe-action-overlay skip" style={{ opacity: Math.max(0, -swipeProgress) * 1.1 }}>
          <div className="swipe-action-label">
            <X size={44} color="white" strokeWidth={3} />
            SKIP
          </div>
        </div>

        {/* Courier-colored header */}
        <div className={`review-header${reviewCourier ? ' courier-' + reviewCourier.toLowerCase() : ''}`}
          style={{ transform: `translateX(${swipeProgress * 18}px)`, transition: swipeProgress === 0 ? 'transform 0.25s ease' : 'none' }}>
          <div className="review-header-top">
            <div>
              <div className="review-title">REVIEW CONSIGNMENT</div>
              <div className="mono review-awb awb-copyable" onClick={() => copyAwb(reviewData?.awb || lockedAwb)}>
                {reviewData?.awb || lockedAwb}
                {awbCopied && <span className="copy-flash">COPIED</span>}
              </div>
              {inferredCourier && !reviewCourier && (
                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                  AWB suggests: {inferredCourier}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {intelligence?.learnedFieldCount > 0 && (
                <div className="source-badge source-learned">AI {intelligence.learnedFieldCount} corrected</div>
              )}
              {reviewConfidence.score === 0 && (
                <div style={{ fontSize: '0.6rem', background: 'rgba(220,38,38,0.22)', color: '#FCA5A5', padding: '3px 9px', borderRadius: 7, fontWeight: 800, border: '1px solid rgba(220,38,38,0.3)' }}>
                  OCR failed — fill manually
                </div>
              )}
            </div>
          </div>
          <div className="review-meta-row">
            <span className={`review-confidence ${reviewConfidence.level}`}>
              <Shield size={12} />
              {reviewConfidence.label} ({Math.round(reviewConfidence.score * 100)}%)
            </span>
            <button type="button" className="review-chip review-chip-courier" onClick={cycleReviewCourier} title="Tap to change courier">
              <Package size={12} /> {reviewCourier || 'Set courier →'}
            </button>
            <span className="review-chip review-chip-date">
              <CalendarDays size={12} /> {reviewDateLabel || 'No date'}
            </span>
          </div>
        </div>

        {/* Swipe hint bar */}
        <div className="swipe-hint-bar">
          <div className="swipe-hint-side" style={{ color: swipeProgress < -0.2 ? theme.error : theme.mutedLight }}>
            <X size={11} /> SKIP
          </div>
          <div style={{ fontSize: '0.6rem', color: theme.mutedLight, fontWeight: 600, letterSpacing: '0.05em' }}>
            SWIPE TO APPROVE OR SKIP
          </div>
          <div className="swipe-hint-side" style={{ color: swipeProgress > 0.2 ? theme.success : theme.mutedLight }}>
            SAVE <Check size={11} />
          </div>
        </div>

        {/* Form completion progress */}
        {(() => {
          const required = ['consignee', 'destination', 'weight'];
          const filled = required.filter(k => {
            const v = reviewForm[k];
            return v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim() !== '0';
          }).length;
          const pct = Math.round((filled / required.length) * 100);
          return (
            <div className="form-progress-bar-wrap">
              <div className="form-progress-bar-track">
                <div className="form-progress-bar-fill" style={{ width: pct + '%' }} />
              </div>
              <div className="form-progress-label" style={{ color: pct === 100 ? theme.success : theme.muted }}>
                {pct === 100 ? '✓ Ready to save' : `${filled}/${required.length} required`}
              </div>
            </div>
          );
        })()}

        <div className="scroll-panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* CLIENT */}
          <div className={`field-card field-card-animated ${(fieldConfidence.clientCode?.confidence || 0) < 0.55 ? 'warning' : 'conf-high'}`}>
            <div className={confDotClass(fieldConfidence.clientCode?.confidence || 0)} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <span className="field-label" style={{ margin: 0 }}>Client</span>
                {fieldConfidence.clientCode?.source && (() => { const s = sourceLabel(fieldConfidence.clientCode.source); return s ? <span className={s.className}>{s.icon} {s.text}</span> : null; })()}
              </div>
              <input className="field-input" value={reviewForm.clientCode || ''}
                onChange={e => setReviewForm(f => ({ ...f, clientCode: e.target.value.toUpperCase() }))}
                placeholder="Client code"
                autoCapitalize="characters" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 7, gap: 8 }}>
                <div style={{ fontSize: '0.6rem', color: theme.muted }}>
                  {stickyClientCode
                    ? <span style={{ color: theme.primary, fontWeight: 700 }}>📌 Sticky: {stickyClientCode}</span>
                    : 'Sticky off'}
                </div>
                {stickyClientCode
                  ? <button type="button" className="suggest-chip" onClick={() => setStickyClientCode('')}>Clear</button>
                  : <button type="button" className="suggest-chip" onClick={() => { const c = normalizeClientCode(reviewForm.clientCode || ''); if (c && c !== 'MISC') setStickyClientCode(c); }}>Keep this client</button>
                }
              </div>
              {intelligence?.clientMatches?.length > 0 && intelligence.clientNeedsConfirmation && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 7 }}>
                  {intelligence.clientMatches.slice(0, 3).map(m => (
                    <button key={m.code} type="button"
                      className={`suggest-chip ${reviewForm.clientCode === m.code ? 'active' : ''}`}
                      onClick={() => setReviewForm(f => ({ ...f, clientCode: m.code }))}>
                      {m.code} ({Math.round(m.score * 100)}%)
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CONSIGNEE — required */}
          <div className={`field-card field-card-animated ${!reviewForm.consignee?.trim() ? 'required-empty' : 'conf-high'}`}>
            <div className={!reviewForm.consignee?.trim() ? 'conf-dot conf-low' : confDotClass(fieldConfidence.consignee?.confidence || 0)} />
            <div style={{ flex: 1 }}>
              <div className="field-label">
                Consignee <span className="field-required-star">*</span>
                {fieldConfidence.consignee?.source && (() => { const s = sourceLabel(fieldConfidence.consignee.source); return s ? <span className={s.className} style={{ marginLeft: 4 }}>{s.icon} {s.text}</span> : null; })()}
              </div>
              <input className="field-input" value={reviewForm.consignee || ''}
                onChange={e => setReviewForm(f => ({ ...f, consignee: e.target.value.toUpperCase() }))}
                placeholder="Recipient name *"
                autoCapitalize="words" />
            </div>
          </div>

          {/* DESTINATION — required */}
          <div className={`field-card field-card-animated ${!reviewForm.destination?.trim() ? 'required-empty' : 'conf-high'}`}>
            <div className={!reviewForm.destination?.trim() ? 'conf-dot conf-low' : confDotClass(fieldConfidence.destination?.confidence || 0)} />
            <div style={{ flex: 1 }}>
              <div className="field-label">
                Destination <span className="field-required-star">*</span>
                {fieldConfidence.destination?.source && (() => { const s = sourceLabel(fieldConfidence.destination.source); return s ? <span className={s.className} style={{ marginLeft: 4 }}>{s.icon} {s.text}</span> : null; })()}
              </div>
              <input className="field-input" value={reviewForm.destination || ''}
                onChange={e => setReviewForm(f => ({ ...f, destination: e.target.value.toUpperCase() }))}
                placeholder="City *"
                autoCapitalize="words" />
              {intelligence?.pincodeCity && intelligence.pincodeCity !== reviewForm.destination && (
                <button type="button" className="suggest-chip pincode-suggest" style={{ marginTop: 6 }}
                  onClick={() => setReviewForm(f => ({ ...f, destination: intelligence.pincodeCity }))}>
                  📍 Pincode → {intelligence.pincodeCity}
                </button>
              )}
              {!intelligence?.pincodeCity && reviewForm.pincode?.length === 6 && (() => {
                const city = lookupPincodeCity(reviewForm.pincode);
                return city && city !== reviewForm.destination ? (
                  <button type="button" className="suggest-chip pincode-suggest" style={{ marginTop: 6 }}
                    onClick={() => setReviewForm(f => ({ ...f, destination: city }))}>
                    📍 {reviewForm.pincode} → {city}
                  </button>
                ) : null;
              })()}
            </div>
          </div>

          {/* PINCODE + WEIGHT */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="field-card field-card-animated">
              <div style={{ flex: 1 }}>
                <div className="field-label">Pincode</div>
                <input className="field-input" value={reviewForm.pincode || ''}
                  onChange={(e) => {
                    const pin = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                    setReviewForm(f => {
                      const city = pin.length === 6 && !f.destination?.trim() ? lookupPincodeCity(pin) : '';
                      return { ...f, pincode: pin, ...(city ? { destination: city } : {}) };
                    });
                  }}
                  placeholder="6 digits" maxLength={6} inputMode="numeric" />
              </div>
            </div>
            <div className={`field-card field-card-animated ${intelligence?.weightAnomaly?.anomaly ? 'warning' : (!reviewForm.weight || String(reviewForm.weight).trim() === '0' ? 'required-empty' : 'conf-med')}`}>
              <div style={{ flex: 1 }}>
                <div className="field-label">Weight (kg) <span className="field-required-star">*</span></div>
                <input className="field-input" value={reviewForm.weight || ''}
                  onChange={(e) => setReviewForm(f => ({ ...f, weight: e.target.value }))}
                  placeholder="0.0 *" inputMode="decimal" />
                {intelligence?.weightAnomaly?.anomaly && (
                  <div style={{ fontSize: '0.6rem', color: theme.warning, marginTop: 3, fontWeight: 700 }}>
                    {intelligence.weightAnomaly.warning}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Weight quick picks */}
          <div className="weight-quick-picks">
            {[0.5, 1, 1.5, 2, 3, 5, 10].map(w => (
              <button key={w} type="button"
                className={`weight-chip ${String(reviewForm.weight) === String(w) ? 'active' : ''}`}
                onClick={() => { setReviewForm(f => ({ ...f, weight: w })); pulseHaptic('tap'); }}>
                {w}kg
              </button>
            ))}
          </div>

          {/* AMOUNT + ORDER NO */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="field-card field-card-animated">
              <div style={{ flex: 1 }}>
                <div className="field-label">COD Amount (Rs.)</div>
                <input className="field-input" value={reviewForm.amount || ''}
                  onChange={(e) => setReviewForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0" inputMode="decimal" />
              </div>
            </div>
            <div className="field-card field-card-animated">
              <div style={{ flex: 1 }}>
                <div className="field-label">Order No</div>
                <input className="field-input" value={reviewForm.orderNo || ''}
                  onChange={(e) => setReviewForm(f => ({ ...f, orderNo: e.target.value }))}
                  placeholder="Optional" />
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.6rem', color: theme.mutedLight, textAlign: 'center', paddingBottom: 4 }}>
            <span style={{ color: '#E11D48' }}>*</span> Required  ·  Swipe right to save instantly
          </div>
        </div>

        {/* Action bar */}
        <div style={{ padding: '10px 16px 24px', borderTop: `1px solid ${theme.border}`, display: 'flex', gap: 10, background: theme.surface }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => {
            if (isStandalone) { navigate('/scan-mobile'); return; }
            resetForNextScan();
          }}>
            <X size={15} /> Skip
          </button>
          <button data-testid="approve-save-btn" className="btn btn-success btn-lg" style={{ flex: 2 }} onClick={submitApproval} disabled={step === STEPS.APPROVING}>
            {step === STEPS.APPROVING
              ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
              : <><Check size={15} /> Approve &amp; Save</>}
          </button>
        </div>
      </div>
    </div>
  );
});
