"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, GraduationCap, ImagePlus } from "lucide-react";
import { useLocalUser } from "@/components/UserGate";
import { LoginModal } from "@/components/LoginModal";
import { slugify } from "@/lib/slugify";
import { GUIDE_DIFFICULTIES } from "@/lib/techniquePayloadHelpers";
import { DIFFICULTY_LABELS } from "@/lib/techniqueLabels";

type Category = { id: number; name: string; slug: string };

export default function SkillSubmitPage() {
  const { user } = useLocalUser();
  const [showAuth, setShowAuth] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<{ id: number; title: string }[]>([]);

  const [categoryId, setCategoryId] = useState<number | "">("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [instruction, setInstruction] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState("");
  const [tips, setTips] = useState("");
  const [cocktailSlugs, setCocktailSlugs] = useState("");
  const [naSlugs, setNaSlugs] = useState("");
  const [alcoholSlugs, setAlcoholSlugs] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [relatedArticleId, setRelatedArticleId] = useState("");
  const [photoRights, setPhotoRights] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/technique/skills/categories", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.items)) setCategories(d.items);
      })
      .catch(() => {});
    fetch("/api/knowledge/articles-for-link", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.items)) setArticles(d.items);
      })
      .catch(() => {});
  }, []);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/technique/skills/upload-image", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.ok && data.url) setGalleryUrls((p) => [...p, data.url].slice(0, 12));
      else setError(data.error || "Ошибка загрузки");
    } catch {
      setError("Ошибка сети");
    } finally {
      setUploading(false);
    }
  };

  const splitSlugs = (s: string) =>
    s
      .split(/[\s,;]+/)
      .map((x) => x.trim())
      .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (!photoRights) {
      setError("Подтвердите права на фото");
      return;
    }
    if (categoryId === "") {
      setError("Выберите категорию");
      return;
    }
    const slugFinal = slugify((slug.trim() || slugify(name.trim()) || "").trim());
    if (!slugFinal) {
      setError("Укажите slug");
      return;
    }
    const tags = tagsInput
      .split(/[,;]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/technique/skills/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name: name.trim(),
          slug: slugFinal,
          category_id: categoryId,
          difficulty: difficulty || null,
          short_description: shortDesc.trim() || null,
          instruction_text: instruction.trim() || null,
          video_url: videoUrl.trim() || null,
          gallery_urls: galleryUrls,
          typical_mistakes: mistakes.trim() || null,
          tips: tips.trim() || null,
          cocktail_slugs: splitSlugs(cocktailSlugs),
          na_slugs: splitSlugs(naSlugs),
          alcohol_slugs: splitSlugs(alcoholSlugs),
          tags,
          related_knowledge_article_id: relatedArticleId ? parseInt(relatedArticleId, 10) : null,
          photo_rights_confirmed: true,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Ошибка");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {showAuth && (
        <LoginModal isOpen={showAuth} onClose={() => setShowAuth(false)} initialMode="login" />
      )}
      <Link
        href="/technique/skills"
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Приёмы
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <GraduationCap className="h-8 w-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-zinc-900">Предложить приём / технику</h1>
      </div>

      {success ? (
        <p className="text-green-800 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
          Заявка отправлена на модерацию.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {error ? (
            <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          ) : null}

          <div>
            <label className="block text-zinc-700 mb-1">Категория *</label>
            <select
              required
              value={categoryId === "" ? "" : String(categoryId)}
              onChange={(e) =>
                setCategoryId(e.target.value === "" ? "" : parseInt(e.target.value, 10))
              }
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 bg-white"
            >
              <option value="">— выберите —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-700 mb-1">Название *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-zinc-700 mb-1">Slug *</label>
              <input
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-700 mb-1">Сложность</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 bg-white"
            >
              <option value="">—</option>
              {GUIDE_DIFFICULTIES.map((k) => (
                <option key={k} value={k}>
                  {DIFFICULTY_LABELS[k]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-zinc-700 mb-1">Краткое описание</label>
            <textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} rows={2} className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </div>

          <div>
            <label className="block text-zinc-700 mb-1">Пошаговая инструкция</label>
            <textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} rows={8} className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs" />
          </div>

          <div>
            <label className="block text-zinc-700 mb-1">Видео (URL YouTube / Vimeo)</label>
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer">
              <ImagePlus className="h-4 w-4" />
              {uploading ? "…" : "Фото в галерею"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(f);
                  e.target.value = "";
                }}
              />
            </label>
            <div className="flex flex-wrap gap-1 mt-2">
              {galleryUrls.map((u) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img key={u} src={u} alt="" className="h-12 w-12 rounded object-cover" />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-zinc-700 mb-1">Типичные ошибки</label>
            <textarea value={mistakes} onChange={(e) => setMistakes(e.target.value)} rows={3} className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-zinc-700 mb-1">Советы</label>
            <textarea value={tips} onChange={(e) => setTips(e.target.value)} rows={3} className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </div>

          <div>
            <label className="block text-zinc-700 mb-1">Slug коктейлей (через запятую)</label>
            <input value={cocktailSlugs} onChange={(e) => setCocktailSlugs(e.target.value)} className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs" />
          </div>
          <div>
            <label className="block text-zinc-700 mb-1">Slug Б/А</label>
            <input value={naSlugs} onChange={(e) => setNaSlugs(e.target.value)} className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs" />
          </div>
          <div>
            <label className="block text-zinc-700 mb-1">Slug алкоголя</label>
            <input value={alcoholSlugs} onChange={(e) => setAlcoholSlugs(e.target.value)} className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs" />
          </div>

          <div>
            <label className="block text-zinc-700 mb-1">Теги</label>
            <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </div>

          <div>
            <label className="block text-zinc-700 mb-1">Статья</label>
            <select
              value={relatedArticleId}
              onChange={(e) => setRelatedArticleId(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 bg-white"
            >
              <option value="">—</option>
              {articles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={photoRights} onChange={(e) => setPhotoRights(e.target.checked)} className="mt-1" />
            <span>Подтверждаю права на изображения</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary-600 text-white px-6 py-2.5 font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? "Отправка…" : "Отправить"}
          </button>
        </form>
      )}
    </div>
  );
}
