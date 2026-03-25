"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { useLocalUser } from "@/components/UserGate";

type Category = { id: number; name: string; slug: string; sort_order: number };

export default function AdminCocktailCategoriesPage() {
  const { user, isLoading: authLoading } = useLocalUser();
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editSort, setEditSort] = useState(0);
  const [newName, setNewName] = useState("");
  const [newSort, setNewSort] = useState(0);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/cocktails/categories")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setCats(d.items || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setError(null);
    const res = await fetch("/api/admin/cocktails/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), sort_order: newSort }),
    });
    const json = await res.json();
    if (json.ok) {
      setNewName("");
      setNewSort(0);
      setAdding(false);
      load();
    } else {
      setError(json.error);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    setError(null);
    const res = await fetch(`/api/admin/cocktails/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), sort_order: editSort }),
    });
    const json = await res.json();
    if (json.ok) {
      setEditId(null);
      load();
    } else {
      setError(json.error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить категорию?")) return;
    setError(null);
    const res = await fetch(`/api/admin/cocktails/categories/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.ok) load();
    else setError(json.error);
  };

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

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/admin/cocktails" className="text-sm text-primary-600 hover:underline mb-4 inline-block">
          ← Каталог коктейлей
        </Link>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">Категории коктейлей</h1>
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline"
          >
            <Plus className="h-4 w-4" /> Добавить
          </button>
        </div>

        {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">{error}</div>}

        {adding && (
          <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-4 flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm text-zinc-600">Название</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="w-24">
              <label className="text-sm text-zinc-600">Порядок</label>
              <input type="number" value={newSort} onChange={(e) => setNewSort(Number(e.target.value))} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
            </div>
            <button onClick={handleCreate} className="text-green-600 hover:text-green-700 p-2"><Check className="h-5 w-5" /></button>
            <button onClick={() => setAdding(false)} className="text-zinc-400 hover:text-zinc-600 p-2"><X className="h-5 w-5" /></button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>
        ) : cats.length === 0 ? (
          <p className="text-zinc-500 text-center py-8">Категорий пока нет</p>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
            {cats.map((cat) => (
              <div key={cat.id} className="px-4 py-3 flex items-center gap-3">
                {editId === cat.id ? (
                  <>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 rounded border border-zinc-200 px-2 py-1 text-sm" />
                    <input type="number" value={editSort} onChange={(e) => setEditSort(Number(e.target.value))} className="w-20 rounded border border-zinc-200 px-2 py-1 text-sm" />
                    <button onClick={() => handleUpdate(cat.id)} className="text-green-600"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setEditId(null)} className="text-zinc-400"><X className="h-4 w-4" /></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-zinc-900">{cat.name}</span>
                    <span className="text-xs text-zinc-400 w-16">#{cat.sort_order}</span>
                    <button
                      onClick={() => { setEditId(cat.id); setEditName(cat.name); setEditSort(cat.sort_order); }}
                      className="text-zinc-400 hover:text-primary-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="text-zinc-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
