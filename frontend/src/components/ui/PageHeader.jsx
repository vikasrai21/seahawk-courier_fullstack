import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function PageHeader({ title, subtitle, breadcrumbs = [], actions, icon: Icon }) {
  const { dark } = useTheme();

  return (
    <div style={{
      padding: '20px 24px',
      background: 'transparent',
      marginBottom: 20,
    }}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              <span style={{ fontSize: 11, color: dark ? '#525e75' : '#94a3b8', fontWeight: 600 }}>{b}</span>
              {i < breadcrumbs.length - 1 && <ChevronRight size={10} color={dark ? '#334155' : '#cbd5e1'} />}
            </React.Fragment>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            {Icon && (
              <div style={{
                width: 36, height: 36, borderRadius: 12,
                background: dark ? 'rgba(249,115,22,0.15)' : 'rgba(249,115,22,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${dark ? 'rgba(249,115,22,0.25)' : 'rgba(249,115,22,0.15)'}`
              }}>
                <Icon size={18} color="#f97316" />
              </div>
            )}
            <h1 style={{
              fontSize: 24, fontWeight: 800,
              color: dark ? '#f8fafc' : '#0f172a',
              letterSpacing: '-0.4px', margin: 0,
              fontFamily: "'Syne', sans-serif"
            }}>{title}</h1>
          </div>
          {subtitle && (
            <p style={{
              fontSize: 13, color: dark ? '#94a3b8' : '#64748b',
              margin: 0, fontWeight: 500, letterSpacing: '0.01em'
            }}>{subtitle}</p>
          )}
        </div>

        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {actions}
          </div>
        )}
      </div>

      <div style={{
        marginTop: 20, height: 1,
        background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        width: '100%'
      }} />
    </div>
  );
}
