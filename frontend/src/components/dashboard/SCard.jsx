function tokens(dark) {
  return dark ? {
    surface:   'rgba(15, 23, 42, 0.65)',
    border:    'rgba(255, 255, 255, 0.08)',
    text:      '#f8fafc',
    shadow:    '0 8px 32px rgba(0,0,0,0.4)',
    glass:     'blur(12px)',
  } : {
    surface:   'rgba(255, 255, 255, 0.8)',
    border:    'rgba(255, 255, 255, 0.3)',
    text:      '#0f172a',
    shadow:    '0 8px 32px rgba(31, 38, 135, 0.07)',
    glass:     'blur(8px)',
  };
}

export default function SCard({ title, icon: Icon, iconColor, children, dark, delay = '0s' }) {
  const T = tokens(dark);
  
  return (
    <div className="fade-in-up" style={{ 
      background: T.surface, 
      border: `1px solid ${T.border}`, 
      borderRadius: 24, 
      padding: 24, 
      boxShadow: T.shadow, 
      backdropFilter: T.glass, 
      animationDelay: delay 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ 
          width: 32, height: 32, borderRadius: 10, 
          background: `${iconColor}15`, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          border: `1px solid ${iconColor}20` 
        }}>
          <Icon size={16} color={iconColor} />
        </div>
        <span style={{ 
          fontSize: 13, fontWeight: 800, color: T.text, 
          textTransform: 'uppercase', letterSpacing: '0.12em', 
          fontFamily: 'Inter, sans-serif' 
        }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
