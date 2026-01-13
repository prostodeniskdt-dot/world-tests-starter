"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isBanned: boolean;
};

type BanUserModalProps = {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
};

export function BanUserModal({ user, onClose, onSuccess }: BanUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [banType, setBanType] = useState<"permanent" | "temporary">("permanent");
  const [banDate, setBanDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bannedUntil = banType === "temporary" && banDate ? new Date(banDate).toISOString() : null;
      const response = await fetch(`/api/admin/users/${user.id}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banned: !user.isBanned,
          bannedUntil,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        onSuccess();
      } else {
        alert("Ошибка: " + data.error);
      }
    } catch (error) {
      console.error("Ошибка бана:", error);
      alert("Ошибка при изменении статуса бана");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-zinc-200">
          <h2 className="text-xl font-bold text-zinc-900">
            {user.isBanned ? "Разблокировать пользователя" : "Заблокировать пользователя"}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-zinc-50 p-4 rounded-lg">
            <div className="font-medium text-zinc-900">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-sm text-zinc-600">{user.email}</div>
          </div>

          {!user.isBanned && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-700">
                  Тип блокировки
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="banType"
                      value="permanent"
                      checked={banType === "permanent"}
                      onChange={(e) => setBanType(e.target.value as "permanent" | "temporary")}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-zinc-700">Постоянная блокировка</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="banType"
                      value="temporary"
                      checked={banType === "temporary"}
                      onChange={(e) => setBanType(e.target.value as "permanent" | "temporary")}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-zinc-700">Временная блокировка</span>
                  </label>
                </div>
              </div>

              {banType === "temporary" && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Дата окончания блокировки
                  </label>
                  <input
                    type="datetime-local"
                    value={banDate}
                    onChange={(e) => setBanDate(e.target.value)}
                    required={banType === "temporary"}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <div className="font-medium mb-1">Внимание!</div>
                  <div>
                    Заблокированный пользователь не сможет проходить тесты и участвовать в рейтинге.
                  </div>
                </div>
              </div>
            </>
          )}

          {user.isBanned && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-800">
                Разблокировка восстановит доступ пользователя ко всем функциям системы.
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading || (banType === "temporary" && !banDate)}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Обработка..." : user.isBanned ? "Разблокировать" : "Заблокировать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
