"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ToastType = "success" | "error";

export interface ToastOptions {
  title: string;
  message: string;
  details?: string[];
  type?: ToastType;
  /** Duración en ms; 0 = no auto-cerrar. Por defecto 5000 */
  duration?: number;
}

interface ToastState extends ToastOptions {
  id: number;
  type: ToastType;
}

const ToastContext = createContext<{
  show: (opts: ToastOptions) => void;
} | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((opts: ToastOptions) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const id = ++toastId;
    const type = opts.type ?? "success";
    const duration = opts.duration ?? 5000;

    setToast({
      id,
      title: opts.title,
      message: opts.message,
      details: opts.details,
      type,
    });

    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        setToast((t) => (t?.id === id ? null : t));
        timeoutRef.current = null;
      }, duration);
    }
  }, []);

  const dismiss = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "tween", duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed left-4 right-4 top-4 z-[100] mx-auto max-w-md md:left-6 md:right-auto md:max-w-sm"
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
            role="alert"
            aria-live="polite"
          >
            <div className="flex gap-4 rounded-2xl overflow-hidden bg-white/85 dark:bg-neutral-900/90 backdrop-blur-2xl border border-black/[0.06] dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]">
              <div className="flex-1 min-w-0 py-4 pl-4 pr-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                        toast.type === "success"
                          ? "bg-[#34C759]/15 dark:bg-[#30D158]/20"
                          : "bg-[#FF3B30]/15 dark:bg-[#FF453A]/20"
                      }`}
                    >
                      {toast.type === "success" ? (
                        <CheckCircle className="w-5 h-5 text-[#34C759] dark:text-[#30D158]" strokeWidth={2} />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-[#FF3B30] dark:text-[#FF453A]" strokeWidth={2} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[15px] text-[#1D1D1F] dark:text-white leading-tight">
                        {toast.title}
                      </p>
                      <p className="text-[13px] text-[#86868B] dark:text-neutral-400 mt-0.5 leading-snug">
                        {toast.message}
                      </p>
                      {toast.details && toast.details.length > 0 && (
                        <ul className="mt-2 space-y-0.5 max-h-24 overflow-y-auto text-[12px] text-[#86868B] dark:text-neutral-500 list-none pl-0">
                          {toast.details.slice(0, 6).map((line, i) => (
                            <li key={i} className="truncate">• {line}</li>
                          ))}
                          {toast.details.length > 6 && (
                            <li className="text-[11px]">+{toast.details.length - 6} más</li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={dismiss}
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[#86868B] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#1D1D1F] dark:hover:text-white transition-colors touch-manipulation"
                    aria-label="Cerrar"
                  >
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
