"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Eye, Edit, Trash2, ToggleLeft, ToggleRight, Upload, Users, ChevronDown, ChevronUp } from "lucide-react";

type TestItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficultyLevel: number;
  basePoints: number;
  maxAttempts: number | null;
  isPublished: boolean;
  visibility: "public" | "restricted";
  questionCount: number;
  createdAt: string;
  updatedAt: string;
};

type AccessUser = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
};

export function AdminTestsList({ initialTests }: { initialTests: TestItem[] }) {
  const router = useRouter();
  const [tests, setTests] = useState(initialTests);
  const [loading, setLoading] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [expandedAccessId, setExpandedAccessId] = useState<string | null>(null);
  const [accessByTest, setAccessByTest] = useState<Record<string, AccessUser[]>>({});
  const [accessLoading, setAccessLoading] = useState<string | null>(null);
  const [emailByTest, setEmailByTest] = useState<Record<string, string>>({});

  const createTest = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Новый тест",
          description: "",
          category: "",
          difficultyLevel: 1,
          basePoints: 200,
          maxAttempts: null,
          questions: [],
          answerKey: {},
        }),
      });
      const data = await res.json();
      if (data.ok && data.testId) {
        router.push(`/admin/tests/${data.testId}/edit`);
      }
    } finally {
      setCreating(false);
    }
  };

  const togglePublish = async (testId: string, current: boolean) => {
    setLoading(testId);
    try {
      const res = await fetch(`/api/admin/tests/${testId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !current }),
      });
      const data = await res.json();
      if (data.ok) {
        setTests((prev) =>
          prev.map((t) => (t.id === testId ? { ...t, isPublished: !current } : t))
        );
      }
    } finally {
      setLoading(null);
    }
  };

  const setVisibility = async (testId: string, visibility: "public" | "restricted") => {
    setLoading(testId);
    try {
      const res = await fetch(`/api/admin/tests/${testId}/visibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ visibility }),
      });
      const data = await res.json();
      if (data.ok) {
        setTests((prev) => prev.map((t) => (t.id === testId ? { ...t, visibility } : t)));
        if (visibility === "restricted") setExpandedAccessId(testId);
      }
    } finally {
      setLoading(null);
    }
  };

  const loadAccessList = useCallback(async (testId: string) => {
    setAccessLoading(testId);
    try {
      const res = await fetch(`/api/admin/tests/${testId}/access`, { credentials: "include" });
      const data = await res.json();
      if (data.ok && Array.isArray(data.users)) {
        setAccessByTest((prev) => ({ ...prev, [testId]: data.users }));
      }
    } finally {
      setAccessLoading(null);
    }
  }, []);

  const toggleAccessPanel = (testId: string) => {
    if (expandedAccessId === testId) {
      setExpandedAccessId(null);
      return;
    }
    setExpandedAccessId(testId);
    void loadAccessList(testId);
  };

  const grantAccess = async (testId: string) => {
    const email = (emailByTest[testId] || "").trim();
    if (!email) return;
    setLoading(testId);
    try {
      const res = await fetch(`/api/admin/tests/${testId}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        setEmailByTest((prev) => ({ ...prev, [testId]: "" }));
        await loadAccessList(testId);
      } else {
        alert(data.error || "Ошибка");
      }
    } finally {
      setLoading(null);
    }
  };

  const revokeAccess = async (testId: string, userId: string) => {
    setLoading(testId);
    try {
      const res = await fetch(`/api/admin/tests/${testId}/access`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.ok) {
        await loadAccessList(testId);
      }
    } finally {
      setLoading(null);
    }
  };

  const deleteTest = async (testId: string, title: string) => {
    if (!confirm(`Удалить тест "${title}"? Это действие необратимо.`)) return;
    setLoading(testId);
    try {
      const res = await fetch(`/api/admin/tests/${testId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setTests((prev) => prev.filter((t) => t.id !== testId));
      }
    } finally {
      setLoading(null);
    }
  };

  const difficultyLabel = (level: number) => {
    return { 1: "Простой", 2: "Средний", 3: "Сложный" }[level] || "?";
  };

  const difficultyColor = (level: number) => {
    return {
      1: "bg-green-100 text-green-700",
      2: "bg-yellow-100 text-yellow-700",
      3: "bg-red-100 text-red-700",
    }[level] || "bg-zinc-100 text-zinc-700";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-sm text-zinc-500">{tests.length} тестов</div>
        <div className="flex items-center gap-2">
          <button
            onClick={createTest}
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {creating ? "Создание…" : "Создать тест"}
          </button>
          <Link
            href="/admin/tests/import"
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Импорт JSON
          </Link>
        </div>
      </div>

      <p className="text-sm text-zinc-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        <strong>Закрытый тест:</strong> режим «По списку» скрывает тест в каталоге для остальных. Добавьте email
        пользователей, которым разрешён доступ. После миграции БД выполните{" "}
        <code className="text-xs bg-white px-1 rounded">npm run run-db-migrations</code>.
      </p>

      <div className="space-y-3">
        {tests.map((test) => (
          <div
            key={test.id}
            className={`border rounded-lg p-4 bg-white transition-colors ${
              test.isPublished ? "border-zinc-200" : "border-dashed border-zinc-300 bg-zinc-50"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-zinc-900 truncate">{test.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColor(test.difficultyLevel)}`}>
                    {difficultyLabel(test.difficultyLevel)}
                  </span>
                  {test.isPublished ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Опубликован
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-200 text-zinc-600">
                      Черновик
                    </span>
                  )}
                  {test.visibility === "restricted" ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                      По списку
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                      Публичный
                    </span>
                  )}
                </div>
                <div className="text-sm text-zinc-500">
                  {test.category} • {test.questionCount} вопросов • {test.basePoints} очков
                  {test.maxAttempts && ` • макс. ${test.maxAttempts} попыток`}
                </div>
                <div className="text-xs text-zinc-400 mt-1">ID: {test.id}</div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-zinc-500">Видимость:</span>
                  <button
                    type="button"
                    disabled={loading === test.id}
                    onClick={() =>
                      setVisibility(test.id, test.visibility === "restricted" ? "public" : "restricted")
                    }
                    className="text-xs font-medium rounded-lg border border-zinc-300 px-2 py-1 hover:bg-zinc-50 disabled:opacity-50"
                  >
                    {test.visibility === "restricted" ? "Сделать публичным" : "Только по списку"}
                  </button>
                  {test.visibility === "restricted" && (
                    <button
                      type="button"
                      onClick={() => toggleAccessPanel(test.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium rounded-lg border border-violet-200 bg-violet-50 text-violet-800 px-2 py-1 hover:bg-violet-100"
                    >
                      <Users className="h-3.5 w-3.5" />
                      Кто имеет доступ
                      {expandedAccessId === test.id ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {expandedAccessId === test.id && test.visibility === "restricted" && (
                  <div className="mt-3 rounded-lg border border-violet-100 bg-violet-50/50 p-3 space-y-3">
                    <div className="flex flex-wrap gap-2 items-end">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-medium text-zinc-600 mb-1">Email пользователя</label>
                        <input
                          type="email"
                          value={emailByTest[test.id] || ""}
                          onChange={(e) =>
                            setEmailByTest((prev) => ({ ...prev, [test.id]: e.target.value }))
                          }
                          placeholder="user@example.com"
                          className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={loading === test.id}
                        onClick={() => grantAccess(test.id)}
                        className="rounded-md bg-violet-600 text-white text-sm font-medium px-3 py-1.5 hover:bg-violet-700 disabled:opacity-50"
                      >
                        Выдать доступ
                      </button>
                    </div>
                    {accessLoading === test.id ? (
                      <p className="text-xs text-zinc-500">Загрузка списка…</p>
                    ) : (
                      <ul className="space-y-1 max-h-40 overflow-y-auto">
                        {(accessByTest[test.id] || []).length === 0 ? (
                          <li className="text-xs text-zinc-500">Пока никого — добавьте email.</li>
                        ) : (
                          (accessByTest[test.id] || []).map((u) => (
                            <li
                              key={u.userId}
                              className="flex items-center justify-between gap-2 text-xs bg-white rounded border border-zinc-200 px-2 py-1"
                            >
                              <span className="truncate">
                                {u.email}{" "}
                                <span className="text-zinc-400">
                                  ({u.firstName} {u.lastName})
                                </span>
                              </span>
                              <button
                                type="button"
                                className="text-red-600 hover:underline flex-shrink-0"
                                disabled={loading === test.id}
                                onClick={() => revokeAccess(test.id, u.userId)}
                              >
                                Убрать
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Link
                  href={`/admin/tests/${test.id}/preview`}
                  className="p-2 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                  title="Превью"
                >
                  <Eye className="h-4 w-4" />
                </Link>
                <Link
                  href={`/admin/tests/${test.id}/edit`}
                  className="p-2 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                  title="Редактировать"
                >
                  <Edit className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => togglePublish(test.id, test.isPublished)}
                  disabled={loading === test.id}
                  className="p-2 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors disabled:opacity-50"
                  title={test.isPublished ? "Снять с публикации" : "Опубликовать"}
                >
                  {test.isPublished ? (
                    <ToggleRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ToggleLeft className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => deleteTest(test.id, test.title)}
                  disabled={loading === test.id}
                  className="p-2 rounded-lg text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Удалить"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {tests.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            Нет тестов. Создайте новый тест или импортируйте JSON.
          </div>
        )}
      </div>
    </div>
  );
}
