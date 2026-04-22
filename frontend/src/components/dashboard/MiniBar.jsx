const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function tokens(dark) {
  return dark ? {
    surfaceHi: 'rgba(13, 20, 37, 0.5)',
    border:    'rgba(99, 130, 191, 0.1)',
    text:      '#f1f5f9',
    textMid:   '#8b9cc0',
    textDim:   '#4a5a7a',
  } : {
    surfaceHi: 'rgba(241, 245, 249, 0.5)',
    border:    'rgba(0, 0, 0, 0.05)',
    text:      '#0f172a',
    textMid:   '#475569',
    textDim:   '#94a3b8',
  };
}

export default function MiniBar({ label, value, max, color, dark, icon: Icon, suffix = "" }) {
  const T = tokens(dark);
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {Icon && <Icon size={12} color={T.textDim} />}
          <span style={{ 
            fontSize: 13, fontWeight: 600, color: T.textMid, 
            maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap' 
          }}>
            {label}
          </span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>
          {suffix ? `${Number(value || 0).toLocaleString('en-IN')}${suffix}` : fmt(value)}
        </span>
      </div>
      <div style={{ 
        background: T.surfaceHi, borderRadius: 10, height: 8, 
        overflow: 'hidden', border: `1px solid ${T.border}` 
      }}>
        <div style={{ 
          height: '100%', borderRadius: 10, 
          background: `linear-gradient(90deg, ${color}, ${color}dd)`, 
          width: `${pct}%`, transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' 
        }} />
      </div>
    </div>
  );
}
