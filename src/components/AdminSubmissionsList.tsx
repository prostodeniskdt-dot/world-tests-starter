"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Submission = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: string;
  created_at: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  category_id: number | null;
  category_name: string | null;
  cover_image_url: string | null;
};

type Category = { id: number; name: string };

export function AdminSubmissionsList({
  submissions,
  categories,
}: {
  submissions: Submission[];
  categories: Category[];
}) {
  const [items, setItems] = useState(submissions);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    setItems(submissions);
  }, [submissions]);

  const handleApprove = async (id: number, categoryId: number) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/knowledge/submissions/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ categoryId }),
      });
      const data = await res.json();
      if (data.ok) {
        setItems((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert(data.error || "Ошибка одобрения");
      }
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: number) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/knowledge/submissions/${id}/reject`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.ok) {
        setItems((prev) => prev.filter((s) => s.id !== id));
      }
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteRejected = async (id: number) => {
    if (!confirm("Удалить эту заявку из списка навсегда?")) return;
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/knowledge/submissions/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.ok) {
        setItems((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert(data.error || "Не удалось удалить");
      }
    } finally {
      setProcessing(null);
    }
  };

  const pending = items.filter((s) => s.status === "pending");
  const others = items.filter((s) => s.status !== "pending");

  return (
    <div className="space-y-6">
      {categories.length === 0 && pending.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Нет категорий для публикации</p>
          <p className="mt-1 text-amber-900">
            Выполните миграции БД (<code className="text-xs bg-amber-100 px-1 rounded">npm run run-db-migrations</code>) и
            при необходимости добавьте категории в разделе{" "}
            <Link href="/admin/knowledge/categories" className="underline font-medium">
              Категории базы знаний
            </Link>
            .
          </p>
        </div>
      )}

      {pending.length === 0 && others.length === 0 ? (
        <p className="text-zinc-500">Нет заявок</p>
      ) : (
        <>
          {pending.length > 0 && (
            <div>
              <h2 className="font-semibold text-zinc-900 mb-3">
                Ожидают модерации ({pending.length})
              </h2>
              <div className="space-y-4">
                {pending.map((s) => (
                  <SubmissionCard
                    key={s.id}
                    s={s}
                    categories={categories}
                    onApprove={(catId) => handleApprove(s.id, catId)}
                    onReject={() => handleReject(s.id)}
                    processing={processing === s.id}
                  />
                ))}
              </div>
            </div>
          )}
          {others.length > 0 && (
            <div>
              <h2 className="font-semibold text-zinc-900 mb-3">Обработанные</h2>
              <div className="space-y-4">
                {others.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-zinc-200 bg-white p-4 opacity-75"
                  >
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div>
                        <span className="font-medium">{s.title}</span>
                        <p className="text-sm text-zinc-500 mt-1">
                          {new Date(s.created_at).toLocaleString("ru-RU")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-sm ${
                            s.status === "approved" ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {s.status === "approved" ? "Одобрено" : "Отклонено"}
                        </span>
                        {s.status === "rejected" && (
                          <button
                            type="button"
                            disabled={processing === s.id}
                            onClick={() => handleDeleteRejected(s.id)}
                            className="text-sm px-2 py-1 rounded-md border border-zinc-300 text-zinc-700 hover:bg-red-50 hover:border-red-200 hover:text-red-800 disabled:opacity-50"
                          >
                            Удалить
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SubmissionCard({
  s,
  categories,
  onApprove,
  onReject,
  processing,
}: {
  s: Submission;
  categories: Category[];
  onApprove: (categoryId: number) => void;
  onReject: () => void;
  processing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [publishCategoryId, setPublishCategoryId] = useState<number | "">("");

  useEffect(() => {
    if (categories.length === 0) {
      setPublishCategoryId("");
      return;
    }
    const next =
      s.category_id != null && categories.some((c) => c.id === s.category_id)
        ? s.category_id
        : categories[0].id;
    setPublishCategoryId((prev) => (prev === "" ? next : prev));
  }, [categories, s.category_id, s.id]);

  const author = [s.first_name, s.last_name].filter(Boolean).join(" ") || s.email || "—";
  const html = String(s.content ?? "");

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {s.cover_image_url ? (
          <div className="flex-shrink-0 w-full sm:w-40 h-28 rounded-lg overflow-hidden border border-zinc-100 bg-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.cover_image_url} alt="" className="w-full h-full object-cover" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div>
              <h3 className="font-semibold text-zinc-900">{s.title}</h3>
              <p className="text-sm text-zinc-500 mt-1">Автор: {author}</p>
              <p className="text-xs text-zinc-400 mt-1">
                {new Date(s.created_at).toLocaleString("ru-RU")}
              </p>
              {s.category_name ? (
                <p className="text-xs text-primary-700 mt-1">Категория автора: {s.category_name}</p>
              ) : null}
              {s.excerpt && (
                <p className="text-sm text-zinc-600 mt-2 line-clamp-2">{s.excerpt}</p>
              )}
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0 sm:min-w-[200px]">
              <label className="text-xs text-zinc-600">
                Категория при публикации
                <select
                  className="mt-1 w-full px-2 py-1.5 rounded-lg border border-zinc-300 text-sm bg-white disabled:bg-zinc-100 disabled:text-zinc-500"
                  value={publishCategoryId === "" ? "" : String(publishCategoryId)}
                  onChange={(e) => setPublishCategoryId(parseInt(e.target.value, 10))}
                  disabled={categories.length === 0}
                >
                  {categories.length === 0 ? (
                    <option value="">Нет категорий — см. подсказку выше</option>
                  ) : (
                    categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (publishCategoryId === "") {
                      alert("Выберите категорию");
                      return;
                    }
                    onApprove(publishCategoryId);
                  }}
                  disabled={processing || categories.length === 0 || publishCategoryId === ""}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  Одобрить
                </button>
                <button
                  type="button"
                  onClick={onReject}
                  disabled={processing}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  Отклонить
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-sm text-primary-600 hover:underline"
          >
            {expanded ? "Свернуть" : "Показать содержание"}
          </button>
          {expanded && (
            <div
              className="knowledge-prose mt-3 p-3 bg-zinc-50 rounded-lg text-sm text-zinc-700 prose prose-sm max-w-none break-words overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
