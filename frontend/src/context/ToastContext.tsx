import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type ToastType = 'error' | 'warning' | 'info' | 'success';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // ms, default 5000
  action?: ToastAction;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Global listener for API client or non-React callers
type GlobalToastHandler = (toast: Omit<ToastItem, 'id'>) => string;
let globalAddToast: GlobalToastHandler | null = null;

export function showGlobalToast(toast: Omit<ToastItem, 'id'>): string {
  if (globalAddToast) {
    return globalAddToast(toast);
  }
  return '';
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast: ToastItem = {
      ...toast,
      id,
    };

    setToasts((prev) => {
      // Avoid duplicate identical error messages stacking up too fast
      const isDuplicate = prev.some(
        (t) => t.type === toast.type && t.message === toast.message && t.title === toast.title
      );
      if (isDuplicate) {
        return prev;
      }
      // Keep max 5 toasts visible at once
      const updated = [...prev, newToast];
      if (updated.length > 5) {
        return updated.slice(updated.length - 5);
      }
      return updated;
    });

    return id;
  }, []);

  useEffect(() => {
    globalAddToast = addToast;
    return () => {
      globalAddToast = null;
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
