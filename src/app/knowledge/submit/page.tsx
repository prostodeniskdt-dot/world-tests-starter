"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useLocalUser } from "@/components/UserGate";
import Link from "next/link";
import { ArrowLeft, Library, ImagePlus } from "lucide-react";
import { LoginModal } from "@/components/LoginModal";

const KnowledgeEditor = dynamic(() => import("@/components/KnowledgeEditor"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[320px] rounded-lg border border-zinc-200 bg-zinc-50 animate-pulse" />
  ),
});

type Category = { id: number; name: string; slug: string };

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("<p></p>");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [tests, setTests] = useState<{ id: string; title: string }[]>([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [practiceTestId, setPracticeTestId] = useState("");

  useEffect(() => {
    let cancelled = false;
    setCategoriesLoading(true);
    setCategoriesError(null);
    fetch("/api/knowledge/categories", { credentials: "same-origin" })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (!r.ok || !data.ok) {
          setCategoriesError(data.error || "Не удалось загрузить категории");
          setCategories([]);
          return;
        }
        const items: Category[] = data.items || [];
        setCategories(items);
        if (items.length > 0) {
          setCategoryId((prev) => (prev === "" ? items[0].id : prev));
        } else {
          setCategoriesError(
            "Категории не настроены. Администратору нужно выполнить миграции БД и добавить категории."
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCategoriesError("Ошибка сети при загрузке категорий");
          setCategories([]);
        }
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setTestsLoading(true);
    fetch("/api/tests", { credentials: "same-origin" })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (r.ok && data.ok && Array.isArray(data.tests)) {
          setTests(
            data.tests.map((t: { id: string; title: string }) => ({ id: t.id, title: t.title }))
          );
        } else {
          setTests([]);
        }
      })
      .catch(() => {
        if (!cancelled) setTests([]);
      })
      .finally(() => {
        if (!cancelled) setTestsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const uploadCover = async (file: File) => {
    setCoverUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/knowledge/upload-image", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.ok && data.url) setCoverUrl(data.url);
      else setError(data.error || "Не удалось загрузить обложку");
    } catch {
      setError("Ошибка сети при загрузке обложки");
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (categoryId === "") {
      setError("Выберите категорию");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/knowledge/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          title: title.trim(),
          excerpt: excerpt.trim() || null,
          content: content.trim(),
          slug: slugify(title.trim()) || `article-${Date.now()}`,
          category_id: categoryId,
          cover_image_url: coverUrl,
          practice_test_id: practiceTestId.trim() || undefined,
        }),
      });

      const raw = await res.text();
      let data: { ok?: boolean; error?: string } = {};
      if (raw) {
        try {
          data = JSON.parse(raw) as { ok?: boolean; error?: string };
        } catch {
          setError(
            res.ok
              ? "Сервер вернул неожиданный ответ. Попробуйте ещё раз или обновите страницу."
              : `Ошибка сервера (код ${res.status}). Попробуйте позже или обратитесь к администратору.`
          );
          return;
        }
      }

      if (!res.ok || data.ok !== true) {
        setError(
          data.error ||
            (res.status >= 500
              ? "Сервер временно недоступен. Попробуйте позже."
              : `Не удалось отправить (${res.status || "ошибка"})`)
        );
        return;
      }

      setSuccess(true);
      setTitle("");
      setExcerpt("");
      setContent("<p></p>");
      setCoverUrl(null);
      setEditorKey((k) => k + 1);
      setPracticeTestId("");
      if (categories.length) setCategoryId(categories[0].id);
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
          <p className="text-emerald-700 mb-4">
            Статья на модерации: на общей странице «База знаний» она появится только после одобрения
            администратором. Статус можно посмотреть в разделе «Мои заявки».
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/knowledge/my-submissions"
              className="inline-flex justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Мои заявки
            </Link>
            <Link
              href="/knowledge"
              className="inline-flex justify-center rounded-lg border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100/50"
            >
              К базе знаний
            </Link>
          </div>
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

      <h1 className="text-2xl font-bold text-zinc-900 mb-2">Предложить статью</h1>
      <p className="text-zinc-600 mb-6 text-sm">
        Заполните форму и отправьте материал на модерацию. Фото в тексте и обложку можно загрузить с
        компьютера (JPEG, PNG, WebP, до 10 МБ; большие изображения автоматически уменьшаются по длинной
        стороне до 2560 px).
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-zinc-700 mb-1">
            Категория *
          </label>
          <select
            id="category"
            required
            value={categoryId === "" ? "" : String(categoryId)}
            onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value, 10) : "")}
            disabled={categoriesLoading || categories.length === 0}
            className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white disabled:bg-zinc-100"
          >
            {categoriesLoading ? (
              <option value="">Загрузка категорий…</option>
            ) : categoriesError || categories.length === 0 ? (
              <option value="">Категории недоступны</option>
            ) : (
              categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            )}
          </select>
          {categoriesError && !categoriesLoading && (
            <p className="text-sm text-amber-800 mt-1">{categoriesError}</p>
          )}
        </div>

        <div>
          <span className="block text-sm font-medium text-zinc-700 mb-1">Обложка (превью)</span>
          <div className="flex flex-wrap items-center gap-3">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="" className="h-24 w-40 object-cover rounded-lg border border-zinc-200" />
            ) : null}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              <ImagePlus className="h-4 w-4" />
              {coverUploading ? "Загрузка…" : coverUrl ? "Заменить" : "Загрузить"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={coverUploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void uploadCover(f);
                }}
              />
            </label>
            {coverUrl ? (
              <button
                type="button"
                className="text-sm text-red-600 hover:underline"
                onClick={() => setCoverUrl(null)}
              >
                Убрать
              </button>
            ) : null}
          </div>
        </div>

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
            placeholder="Краткое описание для списка статей"
          />
        </div>

        <div>
          <label htmlFor="practice-test" className="block text-sm font-medium text-zinc-700 mb-1">
            Тест для закрепления знаний
          </label>
          <p className="text-xs text-zinc-500 mb-2">
            Необязательно. После одобрения статьи в конце материала появится кнопка — она откроет
            выбранный опубликованный тест.
          </p>
          <select
            id="practice-test"
            value={practiceTestId}
            onChange={(e) => setPracticeTestId(e.target.value)}
            disabled={loading || testsLoading}
            className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white disabled:bg-zinc-100"
          >
            <option value="">Не предлагать тест</option>
            {tests.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          {testsLoading ? (
            <p className="text-xs text-zinc-500 mt-1">Загрузка списка тестов…</p>
          ) : tests.length === 0 ? (
            <p className="text-xs text-amber-800 mt-1">
              Нет опубликованных тестов — привязка теста к статье сейчас недоступна.
            </p>
          ) : null}
        </div>

        <div>
          <span className="block text-sm font-medium text-zinc-700 mb-1">Содержание *</span>
          <KnowledgeEditor key={editorKey} value={content} onChange={setContent} disabled={loading} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || categoriesLoading || categories.length === 0}
          className="rounded-lg gradient-primary px-6 py-3 text-white font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Отправка..." : "Отправить на модерацию"}
        </button>
      </form>
    </div>
  );
}
