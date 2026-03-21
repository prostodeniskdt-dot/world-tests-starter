"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Library } from "lucide-react";
import { useLocalUser } from "@/components/UserGate";
import { LoginModal } from "@/components/LoginModal";

type Row = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  category_id: number | null;
  category_name: string | null;
  cover_image_url: string | null;
};

const statusLabel: Record<string, string> = {
  pending: "На модерации",
  approved: "Одобрено",
  rejected: "Отклонено",
};

export default function MyKnowledgeSubmissionsPage() {
  const { user } = useLocalUser();
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetch("/api/knowledge/my-submissions", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setItems(data.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <>
        <LoginModal />
        <div className="max-w-xl mx-auto px-4 py-12 text-center">
          <ClipboardList className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-zinc-900 mb-2">Мои заявки</h1>
          <p className="text-zinc-600 mb-6">Войдите, чтобы видеть статус своих статей.</p>
          <Link href="/knowledge" className="text-primary-600 hover:underline">
            ← База знаний
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/knowledge"
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        База знаний
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <ClipboardList className="h-8 w-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-zinc-900">Мои заявки</h1>
      </div>
      <p className="text-zinc-600 text-sm mb-6">
        Здесь отображаются отправленные на модерацию статьи. После одобрения они появляются в общем списке
        «База знаний».
      </p>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-zinc-200 bg-white animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
          <Library className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-600 mb-4">Вы ещё не отправляли статей на модерацию.</p>
          <Link
            href="/knowledge/submit"
            className="inline-flex rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Предложить статью
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 flex gap-4"
            >
              {s.cover_image_url ? (
                <div className="hidden sm:block flex-shrink-0 w-28 h-20 rounded-lg overflow-hidden border border-zinc-100 bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.cover_image_url} alt="" className="w-full h-full object-cover" />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      s.status === "pending"
                        ? "bg-amber-100 text-amber-900"
                        : s.status === "approved"
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-red-100 text-red-900"
                    }`}
                  >
                    {statusLabel[s.status] || s.status}
                  </span>
                  {s.category_name ? (
                    <span className="text-xs text-zinc-500">{s.category_name}</span>
                  ) : null}
                </div>
                <h2 className="font-semibold text-zinc-900">{s.title}</h2>
                {s.excerpt ? (
                  <p className="text-sm text-zinc-600 mt-1 line-clamp-2">{s.excerpt}</p>
                ) : null}
                <p className="text-xs text-zinc-400 mt-2">
                  Отправлено: {new Date(s.created_at).toLocaleString("ru-RU")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
