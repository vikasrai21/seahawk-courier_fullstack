// src/components/ui/StatCard.jsx — Premium stat card with animated numbers and trend indicators
import { AnimatedNumber, TrendIndicator } from './AnimatedNumber';

const PALETTES = {
  blue:   { bg: 'rgba(59,130,246,0.06)', icon: 'rgba(59,130,246,0.12)', text: '#2563eb', border: 'rgba(59,130,246,0.12)', glow: 'rgba(59,130,246,0.06)' },
  green:  { bg: 'rgba(16,185,129,0.06)', icon: 'rgba(16,185,129,0.12)', text: '#059669', border: 'rgba(16,185,129,0.12)', glow: 'rgba(16,185,129,0.06)' },
  yellow: { bg: 'rgba(245,158,11,0.06)', icon: 'rgba(245,158,11,0.12)', text: '#d97706', border: 'rgba(245,158,11,0.12)', glow: 'rgba(245,158,11,0.06)' },
  red:    { bg: 'rgba(239,68,68,0.06)', icon: 'rgba(239,68,68,0.12)', text: '#dc2626', border: 'rgba(239,68,68,0.12)', glow: 'rgba(239,68,68,0.06)' },
  navy:   { bg: 'rgba(15,23,42,0.04)', icon: 'rgba(15,23,42,0.08)', text: '#334155', border: 'rgba(15,23,42,0.08)', glow: 'rgba(15,23,42,0.04)' },
  purple: { bg: 'rgba(139,92,246,0.06)', icon: 'rgba(139,92,246,0.12)', text: '#7c3aed', border: 'rgba(139,92,246,0.12)', glow: 'rgba(139,92,246,0.06)' },
  orange: { bg: 'rgba(249,115,22,0.06)', icon: 'rgba(249,115,22,0.12)', text: '#ea580c', border: 'rgba(249,115,22,0.12)', glow: 'rgba(249,115,22,0.06)' },
};

export function StatCard({
  label,
  value,
  sub,
  icon,
  color = 'blue',
  trend,
  trendLabel,
  prefix = '',
  suffix = '',
  decimals = 0,
  animate = true,
  onClick,
  className = '',
  delay = 0,
}) {
  const p = PALETTES[color] || PALETTES.blue;
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  const isNumeric = !isNaN(numericValue) && animate;

  return (
    <div
      className={`shk-stat-card ${onClick ? 'shk-stat-card--clickable' : ''} ${className}`}
      onClick={onClick}
      style={{
        '--stat-glow': p.glow,
        '--stat-border': p.border,
        '--stat-delay': `${delay}ms`,
      }}
    >
      <div className="shk-stat-header">
        <span className="shk-stat-label">{label}</span>
        {icon && (
          <div className="shk-stat-icon" style={{ background: p.icon, color: p.text }}>
            {icon}
          </div>
        )}
      </div>

      <div className="shk-stat-value" style={{ color: p.text }}>
        {isNumeric ? (
          <AnimatedNumber value={numericValue} prefix={prefix} suffix={suffix} decimals={decimals} />
        ) : (
          <span>{prefix}{value}{suffix}</span>
        )}
      </div>

      {sub && <p className="shk-stat-sub">{sub}</p>}

      {trend !== undefined && (
        <div className="shk-stat-trend">
          <TrendIndicator value={trend} label={trendLabel || 'vs last period'} />
        </div>
      )}

      <style>{`
        .shk-stat-card {
          position: relative;
          padding: 20px;
          border-radius: 20px;
          border: 1px solid var(--shk-border, #e5ebf3);
          background: var(--shk-surface, #ffffff);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          animation: shk-stat-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) var(--stat-delay, 0ms) backwards;
        }
        .shk-stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--stat-glow), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .shk-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px var(--stat-glow), 0 4px 12px rgba(0,0,0,0.04);
          border-color: var(--stat-border);
        }
        .shk-stat-card:hover::before { opacity: 1; }
        .shk-stat-card--clickable { cursor: pointer; }
        .shk-stat-card--clickable:active { transform: translateY(0) scale(0.98); }
        .shk-stat-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .shk-stat-label {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--shk-text-dim, #94a3b8);
        }
        .shk-stat-icon {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }
        .shk-stat-card:hover .shk-stat-icon {
          transform: scale(1.1) rotate(-3deg);
        }
        .shk-stat-value {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
          line-height: 1.1;
          font-family: 'Outfit', 'Inter', sans-serif;
        }
        .shk-stat-sub {
          font-size: 11px;
          color: var(--shk-text-dim, #94a3b8);
          margin-top: 4px;
          font-weight: 500;
        }
        .shk-stat-trend {
          margin-top: 10px;
        }
        @keyframes shk-stat-in {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        [data-theme="dark"] .shk-stat-card {
          background: linear-gradient(145deg, rgba(13,20,37,0.9), rgba(17,27,48,0.7));
          border-color: rgba(99,130,191,0.12);
        }
        [data-theme="dark"] .shk-stat-card:hover {
          box-shadow: 0 12px 32px rgba(0,0,0,0.3), 0 0 1px var(--stat-border);
        }
      `}</style>
    </div>
  );
}
