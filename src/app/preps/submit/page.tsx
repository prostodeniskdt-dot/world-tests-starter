"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { useLocalUser } from "@/components/UserGate";
import { LoginModal } from "@/components/LoginModal";
import { PrepForm } from "@/components/PrepForm";

type Category = { id: number; name: string };

export default function PrepSubmitPage() {
  const { user } = useLocalUser();
  const [showAuth, setShowAuth] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/preps/categories")
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok) setCategories(data.items || []);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {showAuth && <LoginModal isOpen={showAuth} onClose={() => setShowAuth(false)} initialMode="login" />}

      <Link href="/preps" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" />
        Заготовки
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <Package className="h-8 w-8 text-primary-600" aria-hidden />
        <h1 className="text-2xl font-bold text-zinc-900">Предложить заготовку</h1>
      </div>
      <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
        Заготовка появится в каталоге после проверки администратором. До модерации вы сможете редактировать свою заявку.
      </p>

      {!user && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 mb-6">
          <button
            type="button"
            onClick={() => setShowAuth(true)}
            className="font-semibold text-amber-900 hover:underline"
          >
            Войдите
          </button>
          , чтобы отправить заготовку.
        </div>
      )}

      <PrepForm
        mode="ugc"
        categories={categories}
        initial={null}
        uploadEndpoint="/api/preps/upload-image"
        submitLabel="Отправить на модерацию"
        canSubmit={Boolean(user)}
        requirePhotoRights
        onSubmit={async (payload) => {
          const res = await fetch("/api/preps/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(payload),
          });
          const json = await res.json();
          return { ok: Boolean(json?.ok), error: json?.error };
        }}
      />
    </div>
  );
}

