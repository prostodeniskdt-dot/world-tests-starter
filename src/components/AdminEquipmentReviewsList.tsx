"use client";

import { useEffect, useState } from "react";

export type EquipmentReviewRow = {
  id: number;
  equipment_id: number;
  equipment_name: string;
  equipment_slug: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  rating: number;
  review_text: string | null;
  usage_duration: string | null;
  created_at: string;
  status: string;
};

export function AdminEquipmentReviewsList({ reviews }: { reviews: EquipmentReviewRow[] }) {
  const [items, setItems] = useState(reviews);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    setItems(reviews);
  }, [reviews]);

  const act = async (id: number, action: "approve" | "reject") => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/technique/reviews/${id}/${action}`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.ok) setItems((p) => p.filter((r) => r.id !== id));
      else alert(data.error || "Ошибка");
    } finally {
      setProcessing(null);
    }
  };

  const pending = items.filter((r) => r.status === "pending");

  if (pending.length === 0) {
    return <p className="text-zinc-500">Нет отзывов на модерации</p>;
  }

  return (
    <div className="space-y-4">
      {pending.map((r) => {
        const who = [r.first_name, r.last_name].filter(Boolean).join(" ") || r.email || r.user_id;
        return (
          <div key={r.id} className="rounded-lg border bg-white p-4 text-sm">
            <div className="flex flex-wrap justify-between gap-2 mb-2">
              <div>
                <a
                  href={`/technique/equipment/${encodeURIComponent(r.equipment_slug)}`}
                  className="font-semibold text-primary-600 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {r.equipment_name}
                </a>
                <p className="text-xs text-zinc-500">{who}</p>
              </div>
              <span className="text-amber-600 font-medium">★ {r.rating}</span>
            </div>
            {r.usage_duration ? <p className="text-xs text-zinc-500 mb-1">{r.usage_duration}</p> : null}
            {r.review_text ? <p className="text-zinc-700 whitespace-pre-wrap mb-3">{r.review_text}</p> : null}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={processing === r.id}
                onClick={() => act(r.id, "approve")}
                className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs disabled:opacity-50"
              >
                Одобрить
              </button>
              <button
                type="button"
                disabled={processing === r.id}
                onClick={() => act(r.id, "reject")}
                className="px-3 py-1.5 rounded-lg border text-xs"
              >
                Отклонить
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
