"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Package } from "lucide-react";
import { useLocalUser } from "@/components/UserGate";
import { AdminPrepEditForm } from "@/components/AdminPrepEditForm";

type Category = { id: number; name: string };

export default function AdminPrepEditPage() {
  const params = useParams();
  const prepId = params.id as string;
  const { user, isLoading: authLoading } = useLocalUser();
  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/preps/${prepId}`).then((r) => r.json()),
      fetch("/api/admin/preps/categories").then((r) => r.json()),
    ])
      .then(([itemData, catData]) => {
        if (itemData.ok) setItem(itemData.item);
        else setError(itemData.error || "Ошибка загрузки");
        if (catData.ok) setCategories(catData.items || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [prepId]);

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

  if (error || !item) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Не найдено"}</p>
          <Link href="/admin/preps" className="text-primary-600 hover:underline">
            ← Назад
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/admin/preps" className="text-sm text-primary-600 hover:underline mb-4 inline-block">
          ← Каталог заготовок
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <Package className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-zinc-900">Редактирование: {String(item.name)}</h1>
        </div>
        <AdminPrepEditForm initial={item} categories={categories} mode="edit" />
      </div>
    </div>
  );
}

