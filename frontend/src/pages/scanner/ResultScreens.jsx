import { memo } from 'react';
import {
  RefreshCw, Camera, AlertCircle, RotateCcw, Package,
  WifiOff, Trash2,
} from 'lucide-react';

/**
 * ResultScreens — Approving spinner, Success screen, Error screen,
 * Offline banner, Lock ring flash, Session summary modal, Confirm dialog.
 */
export const ResultScreens = memo(function ResultScreens({
  stepClass,
  STEPS,
  step,
  theme,
  // Data
  reviewData,
  lockedAwb,
  lastSuccess,
  errorMsg,
  offlineQueue,
  sessionCtx,
  totalWeight,
  sessionDuration,
  successAutoSeconds,
  scanWorkflowMode,
  connStatus,
  showLockRing,
  setShowLockRing,
  sessionSummaryOpen,
  setSessionSummaryOpen,
  confirmDialog,
  // Helpers
  getCourierPalette,
  normalizeReviewCourier,
  // Actions
  goStep,
  resetForNextScan,
  setErrorMsg,
  terminateSession,
  approvalResultTimerRef,
}) {
  return (
    <>
      {/* ═══ APPROVING ═══ */}
      <div className={stepClass(STEPS.APPROVING)}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20, background: theme.bg }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: theme.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={34} style={{ animation: 'spin 1s linear infinite', color: theme.primary }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: theme.text }}>Saving Consignment</div>
            <div className="mono" style={{ fontSize: '0.95rem', marginTop: 8, color: theme.muted }}>{reviewData?.awb || lockedAwb}</div>
            <div style={{ fontSize: '0.74rem', color: theme.mutedLight, marginTop: 6, lineHeight: 1.5 }}>
              Communicating with server...<br />If this takes too long, go back and retry.
            </div>
          </div>
          <button className="btn btn-outline" onClick={() => {
            clearTimeout(approvalResultTimerRef.current);
            approvalResultTimerRef.current = null;
            setErrorMsg('Please tap Approve & Save again.');
            goStep(STEPS.REVIEWING);
          }}>
            Back to review
          </button>
        </div>
      </div>

      {/* ═══ SUCCESS ═══ */}
      <div className={stepClass(STEPS.SUCCESS)}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20, background: theme.bg }}>
          {lastSuccess?.courier && (() => {
            const pal = getCourierPalette(normalizeReviewCourier(lastSuccess.courier));
            return (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: pal.light, color: pal.bg, fontSize: '0.7rem', fontWeight: 800, border: `1px solid ${pal.bg}33`, letterSpacing: '0.04em' }}>
                <Package size={13} /> {pal.label}
              </div>
            );
          })()}
          <div style={{ position: 'relative' }}>
            <svg width="88" height="88" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="38" fill={theme.successLight} />
              <circle cx="44" cy="44" r="38" fill="none" stroke={theme.success} strokeWidth="3" className="success-check-circle" />
              <polyline points="26,46 38,58 62,32" fill="none" stroke={theme.success} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="success-check-mark" />
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: theme.success, marginBottom: 6 }}>Saved Successfully</div>
            <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 700, color: theme.text }}>{lastSuccess?.awb}</div>
            {lastSuccess?.clientCode && (
              <div style={{ marginTop: 8, display: 'inline-block', padding: '4px 16px', borderRadius: 999, background: theme.primaryLight, color: theme.primary, fontSize: '0.78rem', fontWeight: 700, border: '1px solid rgba(29,78,216,0.15)' }}>
                {lastSuccess.clientName || lastSuccess.clientCode}
              </div>
            )}
            {lastSuccess?.destination && (
              <div style={{ marginTop: 6, fontSize: '0.78rem', color: theme.muted, fontWeight: 500 }}>
                {lastSuccess.destination} {lastSuccess.weight ? `• ${lastSuccess.weight}kg` : ''}
              </div>
            )}
          </div>
          <div style={{ fontSize: '0.72rem', color: theme.muted, textAlign: 'center', lineHeight: 1.5 }}>
            {lastSuccess?.offlineQueued
              ? `${offlineQueue.length} queued for sync`
              : `Consignment #${sessionCtx.scanNumber} accepted`}
            <br />
            <span style={{ color: theme.mutedLight }}>Auto-continuing in {successAutoSeconds}s</span>
          </div>
          <button data-testid="scan-next-btn" className="btn btn-primary btn-lg btn-full"
            onClick={() => resetForNextScan(scanWorkflowMode === 'fast' ? STEPS.SCANNING : STEPS.IDLE)}
            style={{ maxWidth: 320 }}>
            <Camera size={18} /> {scanWorkflowMode === 'fast' ? 'Keep Scanning' : 'Scan Next Parcel'}
          </button>
        </div>
      </div>

      {/* ═══ ERROR ═══ */}
      <div className={stepClass(STEPS.ERROR)}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20, background: theme.bg }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: theme.errorLight, border: `2px solid rgba(220,38,38,0.18)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={34} color={theme.error} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: theme.error }}>Scan Error</div>
            <div style={{ fontSize: '0.82rem', color: theme.muted, marginTop: 6, lineHeight: 1.5 }}>{errorMsg}</div>
          </div>
          <button className="btn btn-primary" onClick={resetForNextScan}>
            <RotateCcw size={16} /> Try Again
          </button>
        </div>
      </div>

      {/* Offline banner */}
      {connStatus === 'disconnected' && step !== STEPS.IDLE && (
        <div className="offline-banner">
          <WifiOff size={12} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
          Offline — Reconnecting... {offlineQueue.length ? `(${offlineQueue.length} queued)` : ''}
        </div>
      )}

      {/* Lock ring flash */}
      {showLockRing && <div className="lock-ring-flash" onAnimationEnd={() => setShowLockRing(false)} />}

      {/* Session Summary Modal */}
      {sessionSummaryOpen && (
        <div className="session-modal-overlay" onClick={() => setSessionSummaryOpen(false)}>
          <div className="session-modal" onClick={e => e.stopPropagation()}>
            <div className="session-modal-handle" />
            <div style={{ fontSize: '1rem', fontWeight: 800, color: theme.text, marginBottom: 4 }}>End Session?</div>
            <div style={{ fontSize: '0.78rem', color: theme.muted, marginBottom: 12 }}>Summary before you go</div>
            <div className="session-summary-grid">
              <div className="session-summary-tile">
                <div className="session-summary-num">{sessionCtx.scanNumber}</div>
                <div className="session-summary-lbl">Parcels Scanned</div>
              </div>
              <div className="session-summary-tile">
                <div className="session-summary-num">{totalWeight > 0 ? totalWeight.toFixed(1) : '0'}</div>
                <div className="session-summary-lbl">Total Weight kg</div>
              </div>
              <div className="session-summary-tile">
                <div className="session-summary-num">{sessionDuration}</div>
                <div className="session-summary-lbl">Duration</div>
              </div>
              <div className="session-summary-tile">
                <div className="session-summary-num">{offlineQueue.length}</div>
                <div className="session-summary-lbl">Pending Sync</div>
              </div>
            </div>
            {sessionCtx.scannedItems.length > 0 && (() => {
              const cc = {};
              sessionCtx.scannedItems.forEach(item => {
                const c = normalizeReviewCourier(item.courier || '') || 'Other';
                cc[c] = (cc[c] || 0) + 1;
              });
              return (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {Object.entries(cc).map(([c, n]) => {
                    const pal = getCourierPalette(c);
                    return (
                      <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 999, background: pal.light, color: pal.bg, fontSize: '0.7rem', fontWeight: 800, border: `1px solid ${pal.bg}33` }}>
                        {c} × {n}
                      </span>
                    );
                  })}
                </div>
              );
            })()}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline btn-full" onClick={() => setSessionSummaryOpen(false)}>
                Keep Scanning
              </button>
              <button className="btn btn-danger btn-full" onClick={() => { setSessionSummaryOpen(false); terminateSession(); }}>
                <Trash2 size={15} /> End Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      {confirmDialog && (
        <div className="scanner-confirm-overlay" onClick={confirmDialog.onCancel}>
          <div className="scanner-confirm-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="scanner-confirm-handle" />
            <div className="scanner-confirm-message">{confirmDialog.message}</div>
            <div className="scanner-confirm-actions">
              <button type="button" className="scanner-confirm-btn cancel" onClick={confirmDialog.onCancel}>
                Cancel
              </button>
              <button type="button" className="scanner-confirm-btn confirm" onClick={confirmDialog.onConfirm}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
