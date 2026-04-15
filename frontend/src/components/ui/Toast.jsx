import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

const icons = {
  success: <CheckCircle className="w-4 h-4 text-green-500" />,
  error:   <AlertCircle className="w-4 h-4 text-red-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
  info:    <Info className="w-4 h-4 text-blue-500" />,
};

const bg = {
  success: 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/60',
  error:   'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/60',
  warning: 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/60',
  info:    'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/60',
};

export function Toast({ toasts, removeToast }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-start gap-3 p-3 rounded-lg border shadow-md ${bg[t.type] || bg.info} animate-in fade-in slide-in-from-right-2`}>
          {icons[t.type] || icons.info}
          <p className="flex-1 text-sm font-medium text-gray-800 dark:text-slate-100">{t.message}</p>
          <button onClick={() => removeToast(t.id)} className="text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
