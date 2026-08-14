"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DURATION_MS = 5000;

const typeStyles: Record<ToastType, { border: string; iconBg: string; iconColor: string }> = {
  success: {
    border: "border-accent-green/30",
    iconBg: "bg-accent-green/15",
    iconColor: "text-accent-green",
  },
  error: {
    border: "border-red-500/30",
    iconBg: "bg-red-500/15",
    iconColor: "text-red-400",
  },
  info: {
    border: "border-accent-cyan/30",
    iconBg: "bg-accent-cyan/15",
    iconColor: "text-accent-cyan",
  },
};

function ToastIcon({ type }: { type: ToastType }) {
  if (type === "success") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (type === "error") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <circle cx="12" cy="16" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, type, message }]);
      setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  const success = useCallback((message: string) => push("success", message), [push]);
  const error = useCallback((message: string) => push("error", message), [push]);
  const info = useCallback((message: string) => push("info", message), [push]);
  // Identidade estável entre renders — sem isso, todo componente que usa
  // `toast` numa dependência de useEffect refaria o efeito sempre que
  // QUALQUER toast aparecesse/sumisse em qualquer lugar do app (o array
  // `toasts` muda e re-renderiza o provider inteiro).
  const value = useMemo<ToastContextValue>(
    () => ({ success, error, info }),
    [success, error, info],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed top-4 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => {
          const styles = typeStyles[toast.type];
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex w-full items-start gap-2.5 rounded-[10px] border ${styles.border} bg-surface px-4 py-3 text-sm text-foreground shadow-lg shadow-black/30`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full ${styles.iconBg} ${styles.iconColor}`}
              >
                <ToastIcon type={toast.type} />
              </span>
              <span className="flex-1 leading-snug text-text-dim">{toast.message}</span>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Fechar"
                className="flex-none cursor-pointer text-text-mute hover:text-foreground"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast precisa ser usado dentro de <ToastProvider>.");
  }
  return context;
}
