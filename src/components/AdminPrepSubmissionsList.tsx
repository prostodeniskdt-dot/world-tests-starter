"use client";

import { useEffect, useState } from "react";
import { Check, X, Loader2 } from "lucide-react";

export type PrepSubmissionRow = {
  id: number;
  name: string;
  slug: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  user_id: string;
  image_url: string | null;
  category_id: number | null;
  category_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  author?: string | null;
  bar_name?: string | null;
  bar_city?: string | null;
  composition?: string | null;
  tags?: string[] | null;
  photo_rights_confirmed?: boolean | null;
};

type Category = { id: number; name: string };

export function AdminPrepSubmissionsList({
  submissions,
  categories,
}: {
  submissions: PrepSubmissionRow[];
  categories: Category[];
}) {
  const [items, setItems] = useState(submissions);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    setItems(submissions);
  }, [submissions]);

  const approve = async (id: number, categoryId: number | "") => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/preps/submissions/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ categoryId: categoryId === "" ? null : categoryId }),
      });
      const data = await res.json();
      if (data.ok) setItems((p) => p.filter((s) => s.id !== id));
      else alert(data.error || "Ошибка одобрения");
    } finally {
      setProcessing(null);
    }
  };

  const reject = async (id: number) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/preps/submissions/${id}/reject`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.ok) setItems((p) => p.filter((s) => s.id !== id));
      else alert(data.error || "Ошибка");
    } finally {
      setProcessing(null);
    }
  };

  const pending = items.filter((s) => s.status === "pending");
  const others = items.filter((s) => s.status !== "pending");

  if (pending.length === 0 && others.length === 0) {
    return <p className="text-zinc-500">Нет заявок</p>;
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h2 className="font-semibold text-zinc-900 mb-3">Ожидают модерации ({pending.length})</h2>
          <div className="space-y-4">
            {pending.map((s) => (
              <PendingCard
                key={s.id}
                s={s}
                categories={categories}
                processing={processing === s.id}
                onApprove={(catId) => approve(s.id, catId)}
                onReject={() => reject(s.id)}
              />
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <h2 className="font-semibold text-zinc-900 mb-3">Обработанные</h2>
          <div className="space-y-3">
            {others.map((s) => (
              <div key={s.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold text-zinc-900 truncate">{s.name}</div>
                    <div className="text-xs text-zinc-500 mt-1">status: {s.status}</div>
                  </div>
                  <div className="text-xs text-zinc-500 shrink-0">
                    {new Date(s.created_at).toLocaleString("ru-RU")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
  s: PrepSubmissionRow;
  categories: Category[];
  processing: boolean;
  onApprove: (categoryId: number | "") => void;
  onReject: () => void;
}) {
  const [categoryId, setCategoryId] = useState<number | "">(s.category_id ?? "");
  const who = [s.first_name, s.last_name].filter(Boolean).join(" ").trim() || s.email || s.user_id;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-lg bg-zinc-100 overflow-hidden flex items-center justify-center shrink-0">
            {s.image_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={s.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-6 w-6 rounded bg-zinc-200" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-zinc-900">{s.name}</h3>
            <p className="text-xs text-zinc-500 mt-1">slug: {s.slug}</p>
            {s.composition ? (
              <p className="text-sm text-zinc-600 mt-2 line-clamp-3">{s.composition}</p>
            ) : null}
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
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-zinc-700">
              Категория{" "}
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value === "" ? "" : Number(e.target.value))}
                className="ml-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                disabled={processing}
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onReject}
              disabled={processing}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin text-zinc-400" /> : <X className="h-4 w-4" />}
              Отклонить
            </button>
            <button
              type="button"
              onClick={() => onApprove(categoryId)}
              disabled={processing}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 text-white px-3 py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Одобрить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

