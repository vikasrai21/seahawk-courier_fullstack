import { memo } from 'react';
import { RotateCcw, Send } from 'lucide-react';

/**
 * PreviewView — Shows the captured AWB image with retake/submit buttons.
 */
export const PreviewView = memo(function PreviewView({
  stepClass,
  STEPS,
  theme,
  lockedAwb,
  capturedImage,
  captureMeta,
  goStep,
  setCapturedImage,
  submitForProcessing,
}) {
  return (
    <div className={stepClass(STEPS.PREVIEW)}>
      <div style={{ background: theme.bg, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '52px 20px 16px', background: 'linear-gradient(135deg, #0D1B2A, #1E2D3D)', color: 'white' }}>
          <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>CAPTURED</div>
          <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>{lockedAwb || 'OCR Capture'}</div>
          {captureMeta.kb > 0 && (
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
              {captureMeta.kb}KB · {captureMeta.width}×{captureMeta.height}
            </div>
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          {capturedImage && <img src={capturedImage} alt="Captured label" className="preview-img" />}
        </div>
        <div style={{ padding: '12px 16px 28px', display: 'flex', gap: 10, background: theme.surface, borderTop: `1px solid ${theme.border}` }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setCapturedImage(null); goStep(STEPS.CAPTURING); }}>
            <RotateCcw size={15} /> Retake
          </button>
          <button data-testid="use-photo-btn" className="btn btn-primary" style={{ flex: 2 }} onClick={submitForProcessing}>
            <Send size={15} /> Read This Label
          </button>
        </div>
      </div>
    </div>
  );
});
