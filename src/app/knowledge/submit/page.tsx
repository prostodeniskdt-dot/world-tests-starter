"use client";

import { useState } from "react";
import { useLocalUser } from "@/components/UserGate";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Library } from "lucide-react";
import { LoginModal } from "@/components/LoginModal";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0400-\u04FF-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function KnowledgeSubmitPage() {
  const { user } = useLocalUser();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/knowledge/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          excerpt: excerpt.trim() || null,
          content: content.trim(),
          slug: slugify(title.trim()) || `article-${Date.now()}`,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Ошибка отправки");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/knowledge"), 2000);
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <>
        <LoginModal />
        <div className="max-w-xl mx-auto px-4 py-12 text-center">
          <Library className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-zinc-900 mb-2">Предложить статью</h1>
          <p className="text-zinc-600 mb-6">
            Войдите или зарегистрируйтесь, чтобы предложить статью в Базу знаний.
          </p>
          <Link href="/knowledge" className="text-primary-600 hover:underline">
            ← Назад к базе знаний
          </Link>
        </div>
      </>
    );
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8">
          <h2 className="text-xl font-bold text-emerald-800 mb-2">Заявка отправлена</h2>
          <p className="text-emerald-700">
            Ваша статья отправлена на модерацию. После одобрения она появится в Базе знаний.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/knowledge"
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        База знаний
      </Link>

      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Предложить статью</h1>
      <p className="text-zinc-600 mb-6">
        Ваша статья будет отправлена на модерацию. После одобрения администратором она будет опубликована.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-zinc-700 mb-1">
            Заголовок *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Заголовок статьи"
          />
        </div>

        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-zinc-700 mb-1">
            Краткое описание
          </label>
          <textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Краткое описание для превью"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-zinc-700 mb-1">
            Содержание *
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={12}
            className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Текст статьи (поддерживается HTML)"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg gradient-primary px-6 py-3 text-white font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Отправка..." : "Отправить на модерацию"}
        </button>
      </form>
    </div>
  );
}
