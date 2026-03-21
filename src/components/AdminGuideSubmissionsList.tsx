"use client";

import { useEffect, useState } from "react";

export type GuideSubmissionRow = {
  id: number;
  name: string;
  slug: string;
  short_description: string | null;
  status: string;
  created_at: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  category_id: number;
  category_name: string | null;
  photo_rights_confirmed: boolean;
};

type Category = { id: number; name: string };

function parseList(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 24);
}

export function AdminGuideSubmissionsList({
  submissions,
  categories,
}: {
  submissions: GuideSubmissionRow[];
  categories: Category[];
}) {
  const [items, setItems] = useState(submissions);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    setItems(submissions);
  }, [submissions]);

  const approve = async (id: number, categoryId: number, equipmentSlugs: string[]) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/technique/guide-submissions/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ categoryId, equipmentSlugs }),
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
      const res = await fetch(`/api/admin/technique/guide-submissions/${id}/reject`, {
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
    if (!confirm("Удалить?")) return;
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/technique/guide-submissions/${id}`, {
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
                    onApprove={(cat, eq) => approve(s.id, cat, eq)}
                    onReject={() => reject(s.id)}
                  />
                ))}
              </div>
            </div>
          )}
          {others.length > 0 && (
            <div>
              <h2 className="font-semibold mb-3">Обработанные</h2>
              <div className="space-y-2">
                {others.map((s) => (
                  <div key={s.id} className="flex justify-between border rounded-lg p-3 bg-white opacity-80">
                    <span className="font-medium">{s.name}</span>
                    {s.status === "rejected" && (
                      <button type="button" onClick={() => del(s.id)} className="text-red-600 text-sm">
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
  s: GuideSubmissionRow;
  categories: Category[];
  processing: boolean;
  onApprove: (categoryId: number, equipmentSlugs: string[]) => void;
  onReject: () => void;
}) {
  const [categoryId, setCategoryId] = useState(s.category_id);
  const [equipment, setEquipment] = useState("");
  const who = [s.first_name, s.last_name].filter(Boolean).join(" ") || s.email || s.user_id;

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="font-semibold">{s.name}</h3>
      <p className="text-xs text-zinc-500">slug: {s.slug}</p>
      {s.category_name ? <p className="text-xs text-primary-700">{s.category_name}</p> : null}
      <p className="text-sm text-zinc-600 mt-2">{s.short_description}</p>
      <p className="text-xs text-zinc-500 mt-2">{who}</p>
      <div className="mt-4 border-t pt-3 space-y-2 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <label>Категория:</label>
          <select
            value={String(categoryId)}
            onChange={(e) => setCategoryId(parseInt(e.target.value, 10))}
            className="border rounded-lg px-2 py-1.5 bg-white"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-zinc-600 mb-1">Оборудование (slug, через запятую):</label>
          <input
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 font-mono text-xs"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={processing}
            onClick={() => onApprove(categoryId, parseList(equipment))}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm disabled:opacity-50"
          >
            Опубликовать
          </button>
          <button type="button" disabled={processing} onClick={onReject} className="px-4 py-2 border rounded-lg text-sm">
            Отклонить
          </button>
        </div>
      </div>
    </div>
  );
}
