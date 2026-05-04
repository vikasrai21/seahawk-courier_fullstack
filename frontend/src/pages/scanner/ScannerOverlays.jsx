import { memo } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * ScannerOverlays — Flash effect, duplicate warning, and diagnostics panel.
 * Pure presentation; receives all state as props.
 */
export const ScannerOverlays = memo(function ScannerOverlays({
  flash,
  setFlash,
  duplicateWarning,
  diagnosticsOpen,
  setDiagnosticsOpen,
  diagnosticsRows,
}) {
  return (
    <>
      {/* Flash overlay */}
      {flash && <div className={`flash-overlay flash-${flash}`} onAnimationEnd={() => setFlash(null)} />}

      {/* Duplicate warning overlay */}
      {duplicateWarning && (
        <div className="duplicate-overlay shake">
          <AlertCircle size={48} color="white" />
          <div className="duplicate-title">DUPLICATE AWB</div>
          <div className="mono duplicate-awb">{duplicateWarning}</div>
          <div className="duplicate-sub">Already scanned in this session</div>
        </div>
      )}

      {/* Diagnostics toggle */}
      <button
        type="button"
        data-testid="scanner-diag-toggle"
        onClick={() => setDiagnosticsOpen((v) => !v)}
        className={`diag-toggle-btn ${diagnosticsOpen ? 'active' : ''}`}
      >
        {diagnosticsOpen ? 'Hide Diag' : 'Show Diag'}
      </button>

      {/* Diagnostics panel */}
      {diagnosticsOpen && (
        <div data-testid="scanner-diag-panel" className="diag-panel">
          <div className="diag-panel-title">Scanner Diagnostics</div>
          <div className="diag-grid">
            {diagnosticsRows.map(([label, value]) => (
              <div key={label} className="diag-row">
                <div className="diag-label">{label}</div>
                <div className="mono diag-value">{value}</div>
              </div>
            ))}
          </div>
          <div className="diag-hint">
            Use this to verify whether Trackon labels are being decoded as `ITF`
            and how quickly the first lock happens after scan start.
          </div>
        </div>
      )}
    </>
  );
});
