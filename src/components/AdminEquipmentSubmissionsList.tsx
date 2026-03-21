"use client";

import { useEffect, useState } from "react";

export type EquipmentSubmissionRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  producer: string | null;
  status: string;
  created_at: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  image_url: string | null;
  category_id: number | null;
  category_name: string | null;
  photo_rights_confirmed: boolean;
};

type Category = { id: number; name: string };

function parseSubs(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export function AdminEquipmentSubmissionsList({
  submissions,
  categories,
}: {
  submissions: EquipmentSubmissionRow[];
  categories: Category[];
}) {
  const [items, setItems] = useState(submissions);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    setItems(submissions);
  }, [submissions]);

  const approve = async (
    id: number,
    categoryId: number | "",
    substituteSlugs: string[],
    linkedGuideSlugs: string[]
  ) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/technique/equipment-submissions/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          categoryId: categoryId === "" ? null : categoryId,
          substituteSlugs,
          linkedGuideSlugs,
        }),
      });
      const data = await res.json();
      if (data.ok) setItems((p) => p.filter((s) => s.id !== id));
      else alert(data.error || "Ошибка");
    } finally {
      setProcessing(null);
    }
  };

  const reject = async (id: number) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/technique/equipment-submissions/${id}/reject`, {
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

  const del = async (id: number) => {
    if (!confirm("Удалить заявку?")) return;
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/technique/equipment-submissions/${id}`, {
        method: "DELETE",
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

  return (
    <div className="space-y-6">
      {pending.length === 0 && others.length === 0 ? (
        <p className="text-zinc-500">Нет заявок</p>
      ) : (
        <>
          {pending.length > 0 && (
            <div>
              <h2 className="font-semibold text-zinc-900 mb-3">Ожидают ({pending.length})</h2>
              <div className="space-y-4">
                {pending.map((s) => (
                  <Card
                    key={s.id}
                    s={s}
                    categories={categories}
                    processing={processing === s.id}
                    onApprove={(cat, sub, guides) => approve(s.id, cat, sub, guides)}
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
                  <div key={s.id} className="rounded-lg border bg-white p-4 opacity-80 flex justify-between gap-2">
                    <div>
                      <span className="font-medium">{s.name}</span>
                      <p className="text-xs text-zinc-500 mt-1">
                        {s.status === "approved" ? "Одобрено" : "Отклонено"} ·{" "}
                        {new Date(s.created_at).toLocaleString("ru-RU")}
                      </p>
                    </div>
                    {s.status === "rejected" && (
                      <button type="button" onClick={() => del(s.id)} className="text-sm text-red-600 hover:underline">
                        Удалить
                      </button>
                    )}
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

function Card({
  s,
  categories,
  processing,
  onApprove,
  onReject,
}: {
  s: EquipmentSubmissionRow;
  categories: Category[];
  processing: boolean;
  onApprove: (cat: number | "", sub: string[], guides: string[]) => void;
  onReject: () => void;
}) {
  const [categoryId, setCategoryId] = useState<number | "">(s.category_id ?? "");
  const [subs, setSubs] = useState("");
  const [guides, setGuides] = useState("");
  const who = [s.first_name, s.last_name].filter(Boolean).join(" ") || s.email || s.user_id;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="w-full sm:w-32 aspect-square bg-zinc-100 rounded-lg overflow-hidden shrink-0">
          {s.image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={s.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">Нет фото</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{s.name}</h3>
          <p className="text-xs text-zinc-500">slug: {s.slug}</p>
          {s.category_name ? <p className="text-xs text-primary-700 mt-1">Категория: {s.category_name}</p> : null}
          <p className="text-sm text-zinc-600 mt-2 line-clamp-4">{s.description}</p>
          <p className="text-xs text-zinc-500 mt-2">
            {who}
            {s.photo_rights_confirmed ? " · фото" : ""}
          </p>
        </div>
      </div>
      <div className="mt-4 border-t pt-4 space-y-3 text-sm">
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-zinc-600">Категория:</label>
            <select
              value={categoryId === "" ? "" : String(categoryId)}
              onChange={(e) =>
                setCategoryId(e.target.value === "" ? "" : parseInt(e.target.value, 10))
              }
              className="border rounded-lg px-2 py-1.5 bg-white min-w-[200px]"
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
        <div>
          <label className="text-zinc-600 block mb-1">Аналоги (slug оборудования):</label>
          <input
            value={subs}
            onChange={(e) => setSubs(e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 font-mono text-xs"
            placeholder="slug1, slug2"
          />
        </div>
        <div>
          <label className="text-zinc-600 block mb-1">Связать с приёмами (slug приёмов):</label>
          <input
            value={guides}
            onChange={(e) => setGuides(e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 font-mono text-xs"
            placeholder="только уже опубликованные"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={processing}
            onClick={() => onApprove(categoryId, parseSubs(subs), parseSubs(guides))}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm disabled:opacity-50"
          >
            Опубликовать
          </button>
          <button
            type="button"
            disabled={processing}
            onClick={onReject}
            className="px-4 py-2 rounded-lg border text-sm"
          >
            Отклонить
          </button>
        </div>
      </div>
    </div>
  );
}
