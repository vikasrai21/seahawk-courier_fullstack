import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface UIState {
  toasts: ToastItem[];
  toast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: number) => void;
}

let toastId = 0;

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  toast: (message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
    }, duration);
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
  },
}));
