import { useState, useCallback } from 'react';
let toastId = 0;
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), duration);
  }, []);
  const removeToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  return { toasts, toast, removeToast };
}
