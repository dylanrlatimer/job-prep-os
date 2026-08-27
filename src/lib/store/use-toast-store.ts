import { create } from 'zustand';

export type ToastType = 'error' | 'success' | 'info';

export type Toast = {
  id: string;
  type: ToastType;
  message?: string;
  errorCode?: string;
};

export type ToastInput = string | { message?: string; errorCode?: string; type?: ToastType };

interface ToastState {
  toasts: Toast[];
  addToast: (input: ToastInput, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

let nextToastId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (input, type = 'error') => {
    const normalized =
      typeof input === 'string'
        ? { message: input, type }
        : { message: input.message, errorCode: input.errorCode, type: input.type ?? type };

    const id = `toast-${++nextToastId}`;
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id,
          type: normalized.type ?? type,
          message: normalized.message,
          errorCode: normalized.errorCode,
        },
      ],
    }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
