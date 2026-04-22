function tokens(dark) {
  return dark ? {
    surface:   'rgba(13, 20, 37, 0.7)',
    border:    'rgba(99, 130, 191, 0.1)',
    text:      '#f1f5f9',
    shadow:    '0 8px 32px rgba(0,0,0,0.35), 0 0 1px rgba(99,130,191,0.1)',
    glass:     'blur(16px)',
  } : {
    surface:   'rgba(255, 255, 255, 0.8)',
    border:    'rgba(0, 0, 0, 0.06)',
    text:      '#0f172a',
    shadow:    '0 8px 32px rgba(31, 38, 135, 0.07)',
    glass:     'blur(8px)',
  };
}

export default function SCard({ title, icon: Icon, iconColor, children, dark, delay = '0s' }) {
  const T = tokens(dark);
  
  return (
    <div className="fade-in-up group" style={{ 
      background: T.surface, 
      border: `1px solid ${T.border}`, 
      borderRadius: 24, 
      padding: 24, 
      boxShadow: T.shadow, 
      backdropFilter: T.glass, 
      animationDelay: delay,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.4s ease',
    }}>
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${iconColor}, ${iconColor}44, transparent)`,
        opacity: 0.5,
        transition: 'opacity 0.4s ease',
      }} className="group-hover:!opacity-100" />

      {/* Ambient glow */}
      {dark && (
        <div style={{
          position: 'absolute', top: -30, right: -30,
          width: 120, height: 120, borderRadius: '50%',
          background: `${iconColor}08`,
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, position: 'relative', zIndex: 1 }}>
        <div style={{ 
          width: 32, height: 32, borderRadius: 10, 
          background: `${iconColor}15`, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          border: `1px solid ${iconColor}25`,
          boxShadow: `0 4px 12px ${iconColor}10`,
        }}>
          <Icon size={16} color={iconColor} />
        </div>
        <span style={{ 
          fontSize: 13, fontWeight: 800, color: iconColor, 
          textTransform: 'uppercase', letterSpacing: '0.12em', 
          fontFamily: 'Inter, sans-serif',
          opacity: 0.9,
        }}>
          {title}
        </span>
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
