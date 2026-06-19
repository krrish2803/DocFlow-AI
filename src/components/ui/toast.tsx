'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextType {
  toast: (title: string, opts?: { description?: string; variant?: ToastVariant }) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} } as ToastContextType);

export const useToast = () => useContext(ToastContext) as ToastContextType;

const icons: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors: Record<ToastVariant, string> = {
  success: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
  error: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
  info: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
  warning: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
};

const iconColors: Record<ToastVariant, string> = {
  success: 'text-emerald-500', error: 'text-red-500',
  info: 'text-blue-500', warning: 'text-amber-500',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((title: string, opts?: { description?: string; variant?: ToastVariant }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, description: opts?.description, variant: opts?.variant || 'info' }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => {
          const Icon = icons[t.variant];
          return (
            <ToastPrimitive.Root key={t.id} open onOpenChange={() => remove(t.id)}
              className={`flex items-start gap-3 p-3 rounded-lg border shadow-lg ${colors[t.variant]}`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColors[t.variant]}`} />
              <div className="flex-1 min-w-0">
                <ToastPrimitive.Title className="text-sm font-medium">{t.title}</ToastPrimitive.Title>
                {t.description && (
                  <ToastPrimitive.Description className="text-xs mt-0.5 opacity-80">{t.description}</ToastPrimitive.Description>
                )}
              </div>
              <ToastPrimitive.Close className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                <X className="w-4 h-4" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
