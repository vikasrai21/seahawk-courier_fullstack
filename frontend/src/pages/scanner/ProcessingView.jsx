import { memo } from 'react';
import { Brain, RefreshCw } from 'lucide-react';

/**
 * ProcessingView — Skeleton loading screen while OCR/server processes the scan.
 */
export const ProcessingView = memo(function ProcessingView({
  stepClass,
  STEPS,
  theme,
  lockedAwb,
  capturedImage,
  goStep,
  setErrorMsg,
}) {
  return (
    <div className={stepClass(STEPS.PROCESSING)}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: theme.bg }}>
        {/* Top status */}
        <div style={{ padding: '52px 24px 20px', textAlign: 'center', background: 'linear-gradient(135deg, #0D1B2A, #1E2D3D)', color: 'white' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', marginBottom: 14 }}>
            <Brain size={16} color="#93C5FD" style={{ animation: 'spin 2s linear infinite' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#93C5FD', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {capturedImage ? 'Reading Label' : 'Saving Scan'}
            </span>
          </div>
          <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 6 }}>{lockedAwb || '—'}</div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
            {capturedImage ? 'OCR engine extracting fields...' : 'Syncing with server...'}
          </div>
        </div>
        {/* Skeleton fields */}
        <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          {[['Client', '55%'], ['Consignee', '80%'], ['Destination', '65%'], ['Pincode', '40%'], ['Weight (kg)', '35%'], ['Order No', '50%']].map(([label, w]) => (
            <div key={label} className="field-card" style={{ opacity: 0.8 }}>
              <div className="conf-dot conf-none" style={{ background: '#DDE3EC' }} />
              <div style={{ flex: 1 }}>
                <div className="field-label">{label}</div>
                <div className="skeleton" style={{ height: 16, width: w, marginTop: 5 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 20px 28px', textAlign: 'center' }}>
          <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '9px 24px' }}
            onClick={() => { setErrorMsg('Cancelled by user.'); goStep(STEPS.ERROR); }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});
