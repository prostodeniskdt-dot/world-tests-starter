"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

let toastId = 0;
const toasts: Toast[] = [];
const listeners: Array<() => void> = [];

export function addToast(message: string, type: ToastType = "info") {
  const id = `toast-${toastId++}`;
  toasts.push({ id, message, type });
  listeners.forEach(listener => listener());
  
  setTimeout(() => {
    removeToast(id);
  }, 5000);
}

function removeToast(id: string) {
  const index = toasts.findIndex(t => t.id === id);
  if (index > -1) {
    toasts.splice(index, 1);
    listeners.forEach(listener => listener());
  }
}

export function ToastContainer() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1);
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg animate-slide-up min-w-[300px] ${
            toast.type === "success"
              ? "bg-green-950 border border-green-800 text-green-300"
              : toast.type === "error"
              ? "bg-zinc-800 border border-zinc-700 text-zinc-200"
              : "bg-blue-950 border border-blue-800 text-blue-300"
          }`}
          role="alert"
          aria-live="polite"
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          ) : toast.type === "error" ? (
            <XCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          ) : null}
          <span className="flex-1 text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
            aria-label="Закрыть уведомление"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
