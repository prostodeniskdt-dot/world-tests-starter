"use client";

import { useEffect, useState } from "react";

type Category = {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
};

export function AdminKnowledgeCategories() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/admin/knowledge/categories", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setItems(data.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/knowledge/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name, slug: slug.trim() || undefined, sort_order: sortOrder }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Ошибка");
        return;
      }
      setName("");
      setSlug("");
      setSortOrder(0);
      load();
    } finally {
      setSaving(false);
    }
  };

  const updateRow = async (id: number, patch: Partial<Pick<Category, "name" | "slug" | "sort_order">>) => {
    setError(null);
    const res = await fetch(`/api/admin/knowledge/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error || "Ошибка сохранения");
      return;
    }
    load();
  };

  const deleteRow = async (id: number) => {
    if (!confirm("Удалить категорию? У статей и заявок поле категории станет пустым.")) return;
    setError(null);
    const res = await fetch(`/api/admin/knowledge/categories/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error || "Ошибка удаления");
      return;
    }
    load();
  };

  if (loading) {
    return <p className="text-zinc-500">Загрузка…</p>;
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleCreate} className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3">
        <h2 className="font-semibold text-zinc-900">Новая категория</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название"
            required
            className="px-3 py-2 rounded-lg border border-zinc-300 text-sm"
          />
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="slug (латиница, опционально)"
            className="px-3 py-2 rounded-lg border border-zinc-300 text-sm"
          />
          <input
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
            placeholder="Порядок"
            className="px-3 py-2 rounded-lg border border-zinc-300 text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Добавить
        </button>
      </form>

      <div>
        <h2 className="font-semibold text-zinc-900 mb-3">Список</h2>
        <div className="space-y-3">
          {items.map((c) => (
            <CategoryRow key={c.id} c={c} onUpdate={updateRow} onDelete={deleteRow} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryRow({
  c,
  onUpdate,
  onDelete,
}: {
  c: Category;
  onUpdate: (id: number, patch: Partial<Pick<Category, "name" | "slug" | "sort_order">>) => void;
  onDelete: (id: number) => void;
}) {
  const [name, setName] = useState(c.name);
  const [slug, setSlug] = useState(c.slug);
  const [sortOrder, setSortOrder] = useState(c.sort_order);

  useEffect(() => {
    setName(c.name);
    setSlug(c.slug);
    setSortOrder(c.sort_order);
  }, [c.id, c.name, c.slug, c.sort_order]);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 flex flex-col sm:flex-row gap-3 sm:items-end">
      <div className="flex-1 grid sm:grid-cols-3 gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-3 py-2 rounded-lg border border-zinc-300 text-sm"
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="px-3 py-2 rounded-lg border border-zinc-300 text-sm"
        />
        <input
          type="number"
          min={0}
          value={sortOrder}
          onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
          className="px-3 py-2 rounded-lg border border-zinc-300 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="px-3 py-2 rounded-lg bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-900"
          onClick={() => onUpdate(c.id, { name, slug, sort_order: sortOrder })}
        >
          Сохранить
        </button>
        <button
          type="button"
          className="px-3 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50"
          onClick={() => onDelete(c.id)}
        >
          Удалить
        </button>
      </div>
    </div>
  );
}
