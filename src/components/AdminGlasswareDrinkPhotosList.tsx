"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export type GlasswareDrinkPhotoRow = {
  id: number;
  glassware_id: number;
  glassware_name: string;
  glassware_slug: string;
  image_url: string;
  caption: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
};

export function AdminGlasswareDrinkPhotosList({
  photos,
}: {
  photos: GlasswareDrinkPhotoRow[];
}) {
  const [items, setItems] = useState(photos);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    setItems(photos);
  }, [photos]);

  const act = async (id: number, action: "approve" | "reject") => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/glassware/drink-photos/${id}/${action}`, {
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

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-zinc-500">Нет фото на модерации</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-zinc-200 bg-white overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <a
                href={p.image_url}
                target="_blank"
                rel="noreferrer"
                className="block aspect-square bg-zinc-100"
              >
                <img
                  src={p.image_url}
                  alt={p.caption || ""}
                  className="w-full h-full object-cover"
                />
              </a>
              <div className="p-3">
                <Link
                  href={`/glassware/${p.glassware_slug}`}
                  className="text-sm font-medium text-primary-600 hover:underline"
                >
                  {p.glassware_name}
                </Link>
                {p.caption && (
                  <p className="text-xs text-zinc-600 mt-0.5 line-clamp-2">{p.caption}</p>
                )}
                <p className="text-xs text-zinc-500 mt-1">
                  {(p.first_name || p.last_name) && (
                    <span>От: {[p.first_name, p.last_name].filter(Boolean).join(" ")} · </span>
                  )}
                  {new Date(p.created_at).toLocaleString("ru-RU")}
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    disabled={processing === p.id}
                    onClick={() => act(p.id, "approve")}
                    className="text-sm px-3 py-1.5 rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    Одобрить
                  </button>
                  <button
                    type="button"
                    disabled={processing === p.id}
                    onClick={() => act(p.id, "reject")}
                    className="text-sm px-3 py-1.5 rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                  >
                    Отклонить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
