import { memo } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';

/**
 * ConnectionScreen — Shown when socket is connecting or disconnected.
 * Renders a centered status icon + message + reconnect button.
 */
export const ConnectionScreen = memo(function ConnectionScreen({
  connStatus,
  errorMsg,
  isStandalone,
  pin,
  stepClass,
  STEPS,
  theme,
}) {
  if (connStatus === 'paired') return null;

  return (
    <div className={stepClass(STEPS.IDLE)}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: theme.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {connStatus === 'connecting'
            ? <RefreshCw size={28} color={theme.primary} style={{ animation: 'spin 1s linear infinite' }} />
            : <WifiOff size={28} color={theme.error} />}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>
            {connStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </div>
          <div style={{ fontSize: '0.82rem', color: theme.muted }}>
            {errorMsg || (isStandalone ? 'Preparing direct scanner session' : `Connecting to session ${pin}`)}
          </div>
        </div>
        {connStatus === 'disconnected' && (
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            <RefreshCw size={16} /> Reconnect
          </button>
        )}
      </div>
    </div>
  );
});
