import { useUIStore } from '../stores/uiStore';

export function useToast() {
  const toasts = useUIStore((state) => state.toasts);
  const toast = useUIStore((state) => state.toast);
  const removeToast = useUIStore((state) => state.removeToast);
  return { toasts, toast, removeToast };
}
