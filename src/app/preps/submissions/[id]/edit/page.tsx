"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Package } from "lucide-react";
import { useLocalUser } from "@/components/UserGate";
import { PrepForm } from "@/components/PrepForm";

type Category = { id: number; name: string };

export default function EditPrepSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as string;
  const { user, isLoading: authLoading } = useLocalUser();

  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/preps/submissions/${submissionId}`, { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/preps/categories").then((r) => r.json()),
    ])
      .then(([itemData, catData]) => {
        if (itemData?.ok) setItem(itemData.item);
        else setError(itemData?.error || "Ошибка загрузки");
        if (catData?.ok) setCategories(catData.items || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [submissionId]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-700">Войдите, чтобы редактировать заявку.</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Не найдено"}</p>
          <Link href="/preps/my" className="text-primary-600 hover:underline">
            ← Назад
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/preps/my" className="text-sm text-primary-600 hover:underline mb-4 inline-block">
          ← Мои заявки
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <Package className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-zinc-900">Редактирование заявки</h1>
        </div>

        <PrepForm
          mode="ugc"
          categories={categories}
          initial={item}
          uploadEndpoint="/api/preps/upload-image"
          submitLabel="Сохранить изменения"
          canSubmit
          requirePhotoRights
          onSubmit={async (payload) => {
            const res = await fetch(`/api/preps/submissions/${submissionId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
              body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (json?.ok) {
              router.push("/preps/my");
            }
            return { ok: Boolean(json?.ok), error: json?.error };
          }}
        />
      </div>
    </div>
  );
}

