"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { validateEmail } from "@/lib/emailValidator";
import { addToast } from "./Toast";

type ForgotPasswordModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const validation = validateEmail(email);
    if (!validation.valid) {
      setError(validation.error || "Введите корректный email");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const result = await response.json();
      if (result.ok) {
        setSuccess(true);
        addToast("Инструкции отправлены на email", "success");
      } else {
        const errorMsg = result.error || "Ошибка при отправке запроса";
        setError(errorMsg);
        addToast(errorMsg, "error");
      }
    } catch {
      setError("Ошибка при отправке запроса");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scale-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors"
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" />
        </button>
        
        <h2 className="text-2xl font-bold mb-2 text-center text-gradient">
          Восстановление пароля
        </h2>
        
        {success ? (
          <div className="text-center py-6">
            <div className="text-green-600 mb-4 text-sm">
              Инструкции по восстановлению пароля отправлены на ваш email.
            </div>
            <button
              onClick={onClose}
              className="rounded-lg gradient-primary px-6 py-2 text-sm font-semibold text-white hover:opacity-90 transition-all"
            >
              Закрыть
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ваш email"
                required
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              />
            </div>
            
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-zinc-900 text-white py-2 rounded-md disabled:opacity-50 transition-colors"
              >
                {loading ? "Отправка..." : "Отправить"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-md hover:bg-zinc-50 transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
