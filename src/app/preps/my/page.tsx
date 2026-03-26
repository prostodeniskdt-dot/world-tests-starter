"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Pencil, Clock } from "lucide-react";

type Item = {
  id: number;
  status: "pending" | "approved" | "rejected";
  name: string;
  slug: string;
  image_url: string | null;
  created_at: string;
};

export default function MyPrepSubmissionsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/preps/my-submissions?status=pending", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok) setItems(data.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Package className="h-8 w-8 text-primary-600" aria-hidden />
        <h1 className="text-2xl font-bold text-zinc-900">Мои заготовки на модерации</h1>
      </div>
      <p className="text-sm text-zinc-600 mb-6">
        Здесь можно редактировать заявки со статусом <strong>ожидает</strong>.
      </p>

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-zinc-600">Загрузка…</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex items-center gap-2 text-zinc-700">
            <Clock className="h-4 w-4 text-zinc-400" />
            <span>Нет заявок на модерации.</span>
          </div>
          <Link href="/preps/submit" className="inline-block mt-4 text-primary-600 hover:underline text-sm font-medium">
            Предложить заготовку →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className="rounded-xl border border-zinc-200 bg-white p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-semibold text-zinc-900 truncate">{it.name}</div>
                <div className="text-xs text-zinc-500 mt-1">slug: {it.slug}</div>
              </div>
              <Link
                href={`/preps/submissions/${it.id}/edit`}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 shrink-0"
              >
                <Pencil className="h-4 w-4" />
                Редактировать
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

