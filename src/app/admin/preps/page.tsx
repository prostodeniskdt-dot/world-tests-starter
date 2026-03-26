"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Package, Search, Plus, Pencil, Loader2 } from "lucide-react";
import { useLocalUser } from "@/components/UserGate";

type Item = {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  category_id: number | null;
  is_published: boolean;
  composition: string | null;
};
type Category = { id: number; name: string; slug: string };

export default function AdminPrepsPage() {
  const { user, isLoading: authLoading } = useLocalUser();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | "">("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (categoryFilter !== "") params.set("category", String(categoryFilter));
    const qs = params.toString();
    fetch(`/api/admin/preps${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setItems(d.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q, categoryFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/admin/preps/categories")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setCategories(d.items || []);
      })
      .catch(() => {});
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-red-600">Доступ запрещён</p>
      </div>
    );
  }

  const catName = (id: number | null) => categories.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/admin" className="text-sm text-primary-600 hover:underline mb-4 inline-block">
          ← Админ-панель
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-primary-600" />
            <h1 className="text-2xl font-bold text-zinc-900">Каталог заготовок</h1>
          </div>
          <Link
            href="/admin/preps/create"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 text-white px-4 py-2 text-sm font-medium hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" /> Создать
          </Link>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <Link href="/admin/preps/submissions" className="text-sm text-primary-600 hover:underline font-medium">
            Модерация заявок (UGC)
          </Link>
          <Link href="/admin/preps/categories" className="text-sm text-primary-600 hover:underline font-medium">
            Категории
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-2 flex-1 max-w-md">
            <input
              type="text"
              placeholder="Поиск по названию/составу…"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setQ(searchDraft)}
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button onClick={() => setQ(searchDraft)} className="rounded-lg bg-primary-600 text-white px-3 py-2 hover:bg-primary-700">
              <Search className="h-4 w-4" />
            </button>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value === "" ? "" : Number(e.target.value))}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">Все категории</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-zinc-500 py-12 text-center">Ничего не найдено</p>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-zinc-600">
                <tr>
                  <th className="px-4 py-3 w-12">ID</th>
                  <th className="px-4 py-3">Название</th>
                  <th className="px-4 py-3 hidden md:table-cell">Категория</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Опубл.</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 text-zinc-400">{item.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded bg-zinc-100 flex items-center justify-center overflow-hidden">
                          {item.image_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-4 w-4 text-zinc-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-zinc-900 line-clamp-1">{item.name}</div>
                          {item.composition ? (
                            <div className="text-xs text-zinc-500 line-clamp-1">{item.composition}</div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 hidden md:table-cell">{catName(item.category_id)}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`h-2 w-2 rounded-full inline-block ${item.is_published ? "bg-green-500" : "bg-zinc-300"}`} />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/preps/${item.id}/edit`} className="inline-flex items-center gap-1 text-primary-600 hover:underline text-sm">
                        <Pencil className="h-3.5 w-3.5" /> Ред.
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-zinc-100 text-xs text-zinc-500">Всего: {items.length}</div>
          </div>
        )}
      </div>
    </div>
  );
}

