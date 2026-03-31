import { ArrowUp, ArrowDown } from 'lucide-react';

const fmtN = n => Number(n || 0).toLocaleString('en-IN');

function tokens(dark) {
  return dark ? {
    surface:   'rgba(15, 23, 42, 0.65)',
    border:    'rgba(255, 255, 255, 0.08)',
    text:      '#f8fafc',
    textMid:   '#94a3b8',
    textDim:   '#475569',
    green:     '#10b981',
    red:       '#ef4444',
    shadow:    '0 8px 32px rgba(0,0,0,0.4)',
    glass:     'blur(12px)',
  } : {
    surface:   'rgba(255, 255, 255, 0.8)',
    border:    'rgba(255, 255, 255, 0.3)',
    text:      '#0f172a',
    textMid:   '#475569',
    textDim:   '#94a3b8',
    green:     '#059669',
    red:       '#dc2626',
    shadow:    '0 8px 32px rgba(31, 38, 135, 0.07)',
    glass:     'blur(8px)',
  };
}

export default function KPI({ label, value, sub, icon: Icon, accent, trend, dark }) {
  const T = tokens(dark);
  const up = trend >= 0;
  
  return (
    <div className="fade-in-up" style={{
      background: T.surface, 
      border: `1px solid ${T.border}`,
      borderRadius: 24, 
      padding: '24px 20px',
      boxShadow: T.shadow, 
      backdropFilter: T.glass,
      position: 'relative', 
      overflow: 'hidden',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    }}>
      <div style={{ 
        position: 'absolute', top: 0, left: 0, width: '100%', height: 4, 
        background: `linear-gradient(90deg, ${accent}, transparent)` 
      }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ 
          width: 44, height: 44, borderRadius: 14, 
          background: `${accent}15`, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          border: `1px solid ${accent}25` 
        }}>
          <Icon size={20} color={accent} />
        </div>
        
        {trend !== undefined && trend !== null && (
          <span style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 4, 
            fontSize: 12, fontWeight: 800, borderRadius: 20, padding: '4px 10px', 
            color: up ? T.green : T.red, 
            background: up ? (dark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.06)') : (dark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)'), 
            border: `1px solid ${up ? T.green : T.red}20` 
          }}>
            {up ? <ArrowUp size={11} strokeWidth={3} /> : <ArrowDown size={11} strokeWidth={3} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      
      <div style={{ 
        fontSize: 32, fontWeight: 800, color: T.text, 
        letterSpacing: '-0.03em', lineHeight: 1.1 
      }}>
        {value}
      </div>
      
      <div style={{ 
        fontSize: 13, color: T.textMid, marginTop: 8, 
        fontWeight: 600, letterSpacing: '0.01em' 
      }}>
        {label}
      </div>
      
      {sub && (
        <div style={{ 
          fontSize: 11, color: T.textDim, marginTop: 4, 
          fontWeight: 500 
        }}>
          {sub}
        </div>
      )}
    </div>
  );
}
