"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Martini } from "lucide-react";
import { useLocalUser } from "@/components/UserGate";
import { LoginModal } from "@/components/LoginModal";
import { CocktailForm } from "@/components/CocktailForm";

export default function CocktailSubmitPage() {
  const { user } = useLocalUser();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {showAuth && (
        <LoginModal isOpen={showAuth} onClose={() => setShowAuth(false)} initialMode="login" />
      )}
      <Link
        href="/cocktails"
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Коктейли
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <Martini className="h-8 w-8 text-primary-600" aria-hidden />
        <h1 className="text-2xl font-bold text-zinc-900">Предложить коктейль</h1>
      </div>
      <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
        Рецепт появится в каталоге после проверки модератором. Укажите автора рецепта и бар —
        так удобнее посетителям. Если это классический коктейль, укажите автора оригинального
        рецепта в соответствующем поле — модератор учтёт это при публикации.
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
          , чтобы отправить рецепт.
        </div>
      )}

      <CocktailForm
        mode="ugc"
        categories={[]}
        initial={null}
        uploadEndpoint="/api/cocktails/upload-image"
        submitLabel="Отправить на модерацию"
        canSubmit={Boolean(user)}
        onRequireLogin={() => setShowAuth(true)}
        requirePhotoRights
        onSubmit={async (payload) => {
          const res = await fetch("/api/cocktails/submit", {
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
