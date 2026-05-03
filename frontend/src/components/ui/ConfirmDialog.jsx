import { AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

export function ConfirmDialog({
  open,
  message,
  title = 'Confirm action',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCancel?.();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close confirmation"
        className="absolute inset-0 h-full w-full bg-slate-950/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <section className="relative w-full max-w-lg rounded-t-[28px] border border-slate-200 bg-white p-5 shadow-[0_-24px_70px_rgba(15,23,42,0.28)] sm:rounded-[28px] sm:p-6 dark:border-slate-700 dark:bg-slate-950">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/15">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{message}</p>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
            onClick={onCancel}
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-[0_16px_30px_rgba(220,38,38,0.25)] transition hover:bg-red-700"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
