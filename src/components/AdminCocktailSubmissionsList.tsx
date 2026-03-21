"use client";

import { useEffect, useState } from "react";

export type CocktailSubmissionRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  created_at: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  image_url: string | null;
  author: string | null;
  bar_name: string | null;
  bar_city: string | null;
  photo_rights_confirmed: boolean;
};

type Category = { id: number; name: string };

export function AdminCocktailSubmissionsList({
  submissions,
  categories,
}: {
  submissions: CocktailSubmissionRow[];
  categories: Category[];
}) {
  const [items, setItems] = useState(submissions);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    setItems(submissions);
  }, [submissions]);

  const handleApprove = async (id: number, isClassic: boolean, categoryId: number | "") => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/cocktails/submissions/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          isClassic,
          categoryId: categoryId === "" ? null : categoryId,
        }),
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
      const res = await fetch(`/api/admin/cocktails/submissions/${id}/reject`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.ok) {
        setItems((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert(data.error || "Ошибка");
      }
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteRejected = async (id: number) => {
    if (!confirm("Удалить эту заявку из списка навсегда?")) return;
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/cocktails/submissions/${id}`, {
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
                  <PendingCard
                    key={s.id}
                    s={s}
                    categories={categories}
                    processing={processing === s.id}
                    onApprove={(isClassic, catId) => handleApprove(s.id, isClassic, catId)}
                    onReject={() => handleReject(s.id)}
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
                    className="rounded-lg border border-zinc-200 bg-white p-4 opacity-80"
                  >
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <span className="font-medium">{s.name}</span>
                        <p className="text-sm text-zinc-500 mt-1">
                          {s.status === "approved" ? "Одобрено" : "Отклонено"} ·{" "}
                          {new Date(s.created_at).toLocaleString("ru-RU")}
                        </p>
                      </div>
                      {s.status === "rejected" && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRejected(s.id)}
                          disabled={processing === s.id}
                          className="text-sm text-red-600 hover:underline disabled:opacity-50"
                        >
                          Удалить из списка
                        </button>
                      )}
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

function PendingCard({
  s,
  categories,
  processing,
  onApprove,
  onReject,
}: {
  s: CocktailSubmissionRow;
  categories: Category[];
  processing: boolean;
  onApprove: (isClassic: boolean, categoryId: number | "") => void;
  onReject: () => void;
}) {
  const [isClassic, setIsClassic] = useState(false);
  const [categoryId, setCategoryId] = useState<number | "">("");

  const who = [s.first_name, s.last_name].filter(Boolean).join(" ") || s.email || s.user_id;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-36 shrink-0 aspect-square bg-zinc-100 rounded-lg overflow-hidden flex items-center justify-center">
          {s.image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={s.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-zinc-400 text-xs">Нет фото</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-zinc-900">{s.name}</h3>
          <p className="text-xs text-zinc-500 mt-1">slug: {s.slug}</p>
          <p className="text-sm text-zinc-600 mt-2 line-clamp-3">{s.description}</p>
          <p className="text-xs text-zinc-500 mt-2">
            От: {who}
            {s.photo_rights_confirmed ? " · Права на фото подтверждены" : ""}
          </p>
          {(s.author || s.bar_name) && (
            <p className="text-xs text-zinc-600 mt-1">
              {[s.author, s.bar_name, s.bar_city].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
            <input
              type="radio"
              name={`classic-${s.id}`}
              checked={isClassic}
              onChange={() => setIsClassic(true)}
            />
            Классический (общий раздел классики)
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
            <input
              type="radio"
              name={`classic-${s.id}`}
              checked={!isClassic}
              onChange={() => setIsClassic(false)}
            />
            Авторский
          </label>
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor={`cat-${s.id}`} className="text-sm text-zinc-600">
              Категория (необязательно):
            </label>
            <select
              id={`cat-${s.id}`}
              value={categoryId === "" ? "" : String(categoryId)}
              onChange={(e) =>
                setCategoryId(e.target.value === "" ? "" : parseInt(e.target.value, 10))
              }
              className="text-sm border border-zinc-300 rounded-lg px-2 py-1.5 bg-white"
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={processing}
            onClick={() => onApprove(isClassic, categoryId)}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            Опубликовать
          </button>
          <button
            type="button"
            disabled={processing}
            onClick={onReject}
            className="px-4 py-2 rounded-lg border border-zinc-300 text-zinc-700 text-sm hover:bg-zinc-50 disabled:opacity-50"
          >
            Отклонить
          </button>
        </div>
      </div>
    </div>
  );
}
