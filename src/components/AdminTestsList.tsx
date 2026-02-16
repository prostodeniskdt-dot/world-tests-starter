"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Eye, Edit, Trash2, ToggleLeft, ToggleRight, Upload } from "lucide-react";

type TestItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficultyLevel: number;
  basePoints: number;
  maxAttempts: number | null;
  isPublished: boolean;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
};

export function AdminTestsList({ initialTests }: { initialTests: TestItem[] }) {
  const router = useRouter();
  const [tests, setTests] = useState(initialTests);
  const [loading, setLoading] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

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
                </div>
                <div className="text-sm text-zinc-500">
                  {test.category} • {test.questionCount} вопросов • {test.basePoints} очков
                  {test.maxAttempts && ` • макс. ${test.maxAttempts} попыток`}
                </div>
                <div className="text-xs text-zinc-400 mt-1">ID: {test.id}</div>
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
