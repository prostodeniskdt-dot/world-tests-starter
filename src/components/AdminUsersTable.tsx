"use client";

import { useState, useEffect } from "react";
import { Ban, Unlock, Search, Users, Shield, AlertCircle } from "lucide-react";
import { BanUserModal } from "./BanUserModal";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  telegramUsername: string | null;
  isAdmin: boolean;
  isBanned: boolean;
  bannedUntil: string | null;
  createdAt: string;
  stats: {
    totalPoints: number;
    testsCompleted: number;
  };
};

type AdminUsersTableProps = {
  initialUsers?: User[];
  initialPagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export function AdminUsersTable({ initialUsers = [], initialPagination }: AdminUsersTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [bannedOnly, setBannedOnly] = useState(false);
  const [page, setPage] = useState(initialPagination?.page || 1);
  const [pagination, setPagination] = useState(initialPagination);
  const [banModal, setBanModal] = useState<{ user: User | null; isOpen: boolean }>({
    user: null,
    isOpen: false,
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (search) params.append("search", search);
      if (bannedOnly) params.append("bannedOnly", "true");

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (data.ok) {
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Ошибка загрузки пользователей:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, bannedOnly]);

  const handleBanToggle = async (user: User, banned: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banned }),
      });

      const data = await response.json();
      if (data.ok) {
        fetchUsers(); // Обновляем список
      } else {
        alert("Ошибка: " + data.error);
      }
    } catch (error) {
      console.error("Ошибка бана:", error);
      alert("Ошибка при изменении статуса бана");
    }
  };

  return (
    <div className="space-y-4">
      {/* Фильтры */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Поиск по email, имени, фамилии..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={bannedOnly}
            onChange={(e) => {
              setBannedOnly(e.target.checked);
              setPage(1);
            }}
            className="w-4 h-4"
          />
          <span className="text-sm text-zinc-200">Только забаненные</span>
        </label>
      </div>

      {/* Таблица */}
      <div className="bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900 border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-200 uppercase">
                  Пользователь
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-200 uppercase">
                  Статистика
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-200 uppercase">
                  Статус
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-200 uppercase">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                    Загрузка...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                    Пользователи не найдены
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-900">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-zinc-100">
                          {user.firstName} {user.lastName}
                          {user.isAdmin && (
                            <Shield className="inline-block ml-2 h-4 w-4 text-white" />
                          )}
                        </div>
                        <div className="text-sm text-zinc-400">{user.email}</div>
                        {user.telegramUsername && (
                          <div className="text-xs text-zinc-400">
                            @{user.telegramUsername}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="text-zinc-100 font-medium">
                          {user.stats.totalPoints.toLocaleString()} очков
                        </div>
                        <div className="text-zinc-400">
                          {user.stats.testsCompleted} тестов
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.isBanned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                          <AlertCircle className="h-3 w-3" />
                          Забанен
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          Активен
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!user.isAdmin && (
                        <button
                          onClick={() => setBanModal({ user, isOpen: true })}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            user.isBanned
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                        >
                          {user.isBanned ? (
                            <>
                              <Unlock className="h-4 w-4" />
                              Разбанить
                            </>
                          ) : (
                            <>
                              <Ban className="h-4 w-4" />
                              Забанить
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Пагинация */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-400">
            Показано {((page - 1) * pagination.limit) + 1} - {Math.min(page * pagination.limit, pagination.total)} из {pagination.total}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-zinc-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-900"
            >
              Назад
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-4 py-2 border border-zinc-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-900"
            >
              Вперед
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно бана */}
      {banModal.isOpen && banModal.user && (
        <BanUserModal
          user={banModal.user}
          onClose={() => setBanModal({ user: null, isOpen: false })}
          onSuccess={() => {
            setBanModal({ user: null, isOpen: false });
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}
