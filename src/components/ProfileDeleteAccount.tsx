"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function ProfileDeleteAccount() {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/delete-account", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      } else {
        setConfirmOpen(false);
      }
    } catch {
      setConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-zinc-200">
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
        Удалить аккаунт
      </button>
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Удаление аккаунта</h3>
            <p className="text-sm text-zinc-600 mb-4">
              Вы уверены? Данные будут удалены из базы в течение 14 рабочих дней. Выйти из аккаунта вы сможете сразу.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
                className="px-4 py-2 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Отправка…" : "Удалить аккаунт"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
