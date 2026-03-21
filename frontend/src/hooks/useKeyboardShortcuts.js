// src/hooks/useKeyboardShortcuts.js — Global keyboard shortcuts for power users
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts({ onSearch } = {}) {
  const navigate = useNavigate();

  useEffect(() => {
    function handleKey(e) {
      // Skip if typing in an input/textarea/select
      const tag = document.activeElement?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      // Skip if modifier keys pressed (except Shift for '?')
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case 'n': e.preventDefault(); navigate('/app/entry');    break;
        case 'i': e.preventDefault(); navigate('/app/import');   break;
        case 't': e.preventDefault(); navigate('/app/track');    break;
        case 'd': e.preventDefault(); navigate('/app');          break;
        case 's': e.preventDefault(); navigate('/app/shipments'); break;
        case '/':
          e.preventDefault();
          if (onSearch) onSearch();
          else document.querySelector('input[type="search"], input[placeholder*="earch"]')?.focus();
          break;
        case '?':
          // Show shortcuts help — dispatches custom event
          document.dispatchEvent(new CustomEvent('showShortcutsHelp'));
          break;
        default: break;
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigate, onSearch]);
}
