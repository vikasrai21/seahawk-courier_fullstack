import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ThemeContext = createContext({ dark: true, toggle: () => {} });

export function ThemeProvider({ children }) {
  const location = useLocation();
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('shk-theme');
      if (!saved) return false;
      return saved === 'dark';
    } catch {
      return false;
    }
  });

  const toggle = () => setDark(d => {
    const next = !d;
    localStorage.setItem('shk-theme', next ? 'dark' : 'light');
    return next;
  });

  useEffect(() => {
    const root = document.documentElement;
    const isThemedRoute = location.pathname.startsWith('/app') || location.pathname.startsWith('/portal');

    if (!isThemedRoute) {
      root.removeAttribute('data-theme');
      root.style.removeProperty('background');
      root.style.removeProperty('color');
      return;
    }

    if (dark) {
      // Dark mode — matches the preview HTML exactly
      root.style.setProperty('--shk-bg',         '#0a0f1a');
      root.style.setProperty('--shk-surface',    '#111827');
      root.style.setProperty('--shk-surface-hi', '#1a2236');
      root.style.setProperty('--shk-border',     '#1f2d45');
      root.style.setProperty('--shk-border-hi',  '#2d4060');
      root.style.setProperty('--shk-text',       '#f1f5f9');
      root.style.setProperty('--shk-text-mid',   '#94a3b8');
      root.style.setProperty('--shk-text-dim',   '#475569');
      root.style.setProperty('--shk-orange',     '#f97316');
      root.style.setProperty('--shk-blue',       '#3b82f6');
      root.style.setProperty('--shk-green',      '#22c55e');
      root.style.setProperty('--shk-red',        '#ef4444');
      root.style.setProperty('--shk-yellow',     '#eab308');
      root.style.setProperty('--shk-purple',     '#a855f7');
      root.style.setProperty('--shk-input-bg',   '#1a2236');
      root.style.setProperty('--shk-shadow',     '0 4px 20px rgba(0,0,0,0.5)');
      root.setAttribute('data-theme', 'dark');
      // Override Tailwind light classes for dark mode
      root.style.background = '#0a0f1a';
      root.style.color = '#f1f5f9';
    } else {
      // Light mode — clean professional blue/white
      root.style.setProperty('--shk-bg',         '#f0f4fb');
      root.style.setProperty('--shk-surface',    '#ffffff');
      root.style.setProperty('--shk-surface-hi', '#f1f5ff');
      root.style.setProperty('--shk-border',     '#dde4f0');
      root.style.setProperty('--shk-border-hi',  '#b8c8e8');
      root.style.setProperty('--shk-text',       '#0f172a');
      root.style.setProperty('--shk-text-mid',   '#334155');
      root.style.setProperty('--shk-text-dim',   '#64748b');
      root.style.setProperty('--shk-orange',     '#ea6c0a');
      root.style.setProperty('--shk-blue',       '#2563eb');
      root.style.setProperty('--shk-green',      '#16a34a');
      root.style.setProperty('--shk-red',        '#dc2626');
      root.style.setProperty('--shk-yellow',     '#ca8a04');
      root.style.setProperty('--shk-purple',     '#7c3aed');
      root.style.setProperty('--shk-input-bg',   '#ffffff');
      root.style.setProperty('--shk-shadow',     '0 4px 20px rgba(15,23,42,0.08)');
      root.setAttribute('data-theme', 'light');
      root.style.background = '#f0f4fb';
      root.style.color = '#0f172a';
    }
  }, [dark, location.pathname]);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
