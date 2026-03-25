"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Martini } from "lucide-react";
import { useLocalUser } from "@/components/UserGate";
import { AdminCocktailEditForm } from "@/components/AdminCocktailEditForm";

type Category = { id: number; name: string };

export default function AdminCocktailCreatePage() {
  const { user, isLoading: authLoading } = useLocalUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/cocktails/categories")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setCategories(d.items || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (authLoading || loading) {
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/admin/cocktails" className="text-sm text-primary-600 hover:underline mb-4 inline-block">
          ← Каталог коктейлей
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <Martini className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-zinc-900">Новый коктейль</h1>
        </div>
        <AdminCocktailEditForm categories={categories} mode="create" />
      </div>
    </div>
  );
}
