// src/components/ui/ShortcutsHelp.jsx — Keyboard shortcut reference modal
import { useEffect, useState } from 'react';

const SHORTCUTS = [
  { key: 'N',   desc: 'New shipment entry' },
  { key: 'I',   desc: 'Import shipments' },
  { key: 'T',   desc: 'Track a shipment' },
  { key: 'D',   desc: 'Go to dashboard' },
  { key: 'S',   desc: 'All shipments' },
  { key: '/',   desc: 'Focus search' },
  { key: '?',   desc: 'Show this help' },
  { key: 'Esc', desc: 'Close modal' },
];

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    document.addEventListener('showShortcutsHelp', handler);
    return () => document.removeEventListener('showShortcutsHelp', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-6 w-80 max-w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Keyboard shortcuts</h3>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map(({ key, desc }) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{desc}</span>
              <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono text-gray-700">
                {key}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">Shortcuts work when not typing in an input</p>
      </div>
    </div>
  );
}
