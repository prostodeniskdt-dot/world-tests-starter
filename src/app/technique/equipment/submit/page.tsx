"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Wrench, ImagePlus } from "lucide-react";
import { useLocalUser } from "@/components/UserGate";
import { LoginModal } from "@/components/LoginModal";
import { slugify } from "@/lib/slugify";
import { EQUIPMENT_PRICE_SEGMENTS } from "@/lib/techniquePayloadHelpers";
import { PRICE_SEGMENT_LABELS } from "@/lib/techniqueLabels";

type Category = { id: number; name: string; slug: string };

type SpecRow = { name: string; value: string };
type LinkRow = { label: string; url: string };

export default function EquipmentSubmitPage() {
  const { user } = useLocalUser();
  const [showAuth, setShowAuth] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<{ id: number; title: string }[]>([]);

  const [categoryId, setCategoryId] = useState<number | "">("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [producer, setProducer] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [priceSegment, setPriceSegment] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [audience, setAudience] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [idealFor, setIdealFor] = useState("");
  const [notFor, setNotFor] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [specRows, setSpecRows] = useState<SpecRow[]>([{ name: "", value: "" }]);
  const [linkRows, setLinkRows] = useState<LinkRow[]>([{ label: "", url: "" }]);
  const [tagsInput, setTagsInput] = useState("");
  const [relatedArticleId, setRelatedArticleId] = useState("");
  const [photoRights, setPhotoRights] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/technique/equipment/categories", { credentials: "same-origin" })
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

  const upload = async (file: File, toGallery: boolean) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/technique/equipment/upload-image", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.ok && data.url) {
        if (toGallery) setGalleryUrls((p) => [...p, data.url].slice(0, 12));
        else setImageUrl(data.url);
      } else setError(data.error || "Ошибка загрузки");
    } catch {
      setError("Ошибка сети");
    } finally {
      setUploading(false);
    }
  };

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
    const slugFinal = slugify((slug.trim() || slugify(name.trim()) || "").trim());
    if (!slugFinal) {
      setError("Укажите slug");
      return;
    }
    const key_specs = specRows
      .filter((r) => r.name.trim())
      .map((r) => ({ name: r.name.trim(), value: r.value.trim() }));
    const purchase_links = linkRows
      .filter((r) => r.url.trim().startsWith("http"))
      .map((r) => ({ label: r.label.trim() || "Ссылка", url: r.url.trim() }));
    const tags = tagsInput
      .split(/[,;]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/technique/equipment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name: name.trim(),
          slug: slugFinal,
          category_id: categoryId === "" ? null : categoryId,
          producer: producer.trim() || null,
          description: description.trim() || null,
          image_url: imageUrl,
          gallery_urls: galleryUrls,
          price_segment: priceSegment || null,
          price_range: priceRange.trim() || null,
          purchase_links,
          audience: audience.trim() || null,
          experience_pros: pros.trim() || null,
          experience_cons: cons.trim() || null,
          ideal_for: idealFor.trim() || null,
          not_suitable_for: notFor.trim() || null,
          recommendations: recommendations.trim() || null,
          key_specs,
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
        href="/technique/equipment"
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Оборудование
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <Wrench className="h-8 w-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-zinc-900">Предложить карточку оборудования</h1>
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
            <label className="block text-zinc-700 mb-1">Категория</label>
            <select
              value={categoryId === "" ? "" : String(categoryId)}
              onChange={(e) =>
                setCategoryId(e.target.value === "" ? "" : parseInt(e.target.value, 10))
              }
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 bg-white"
            >
              <option value="">— не выбрана —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-700 mb-1">Название модели *</label>
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
            <label className="block text-zinc-700 mb-1">Производитель / бренд</label>
            <input
              value={producer}
              onChange={(e) => setProducer(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-zinc-700 mb-1">Краткое описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer">
              <ImagePlus className="h-4 w-4" />
              {uploading ? "…" : "Обложка"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(f, false);
                  e.target.value = "";
                }}
              />
            </label>
            <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer">
              + в галерею
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(f, true);
                  e.target.value = "";
                }}
              />
            </label>
            {imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={imageUrl} alt="" className="h-14 w-14 rounded object-cover border" />
            ) : null}
          </div>
          {galleryUrls.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {galleryUrls.map((u) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img key={u} src={u} alt="" className="h-12 w-12 rounded object-cover" />
              ))}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-700 mb-1">Ценовой сегмент</label>
              <select
                value={priceSegment}
                onChange={(e) => setPriceSegment(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 bg-white"
              >
                <option value="">—</option>
                {EQUIPMENT_PRICE_SEGMENTS.map((k) => (
                  <option key={k} value={k}>
                    {PRICE_SEGMENT_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-zinc-700 mb-1">Примерная цена (текст)</label>
              <input
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                placeholder="15–25 тыс. ₽"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-700 mb-1">Для кого</label>
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </div>

          <div>
            <p className="text-zinc-700 mb-1">Где купить (ссылки)</p>
            {linkRows.map((row, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  placeholder="Подпись"
                  value={row.label}
                  onChange={(e) => {
                    const next = [...linkRows];
                    next[i] = { ...next[i], label: e.target.value };
                    setLinkRows(next);
                  }}
                  className="flex-1 rounded-lg border border-zinc-300 px-2 py-1.5"
                />
                <input
                  placeholder="https://…"
                  value={row.url}
                  onChange={(e) => {
                    const next = [...linkRows];
                    next[i] = { ...next[i], url: e.target.value };
                    setLinkRows(next);
                  }}
                  className="flex-[2] rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLinkRows((p) => [...p, { label: "", url: "" }])}
              className="text-xs text-primary-600 hover:underline"
            >
              + строка
            </button>
          </div>

          <div>
            <p className="text-zinc-700 mb-1">Параметр — значение</p>
            {specRows.map((row, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  placeholder="Параметр"
                  value={row.name}
                  onChange={(e) => {
                    const next = [...specRows];
                    next[i] = { ...next[i], name: e.target.value };
                    setSpecRows(next);
                  }}
                  className="flex-1 rounded-lg border border-zinc-300 px-2 py-1.5"
                />
                <input
                  placeholder="Значение"
                  value={row.value}
                  onChange={(e) => {
                    const next = [...specRows];
                    next[i] = { ...next[i], value: e.target.value };
                    setSpecRows(next);
                  }}
                  className="flex-1 rounded-lg border border-zinc-300 px-2 py-1.5"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setSpecRows((p) => [...p, { name: "", value: "" }])}
              className="text-xs text-primary-600 hover:underline"
            >
              + строка
            </button>
          </div>

          <div>
            <label className="block text-zinc-700 mb-1">Плюсы</label>
            <textarea value={pros} onChange={(e) => setPros(e.target.value)} rows={3} className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-zinc-700 mb-1">Минусы</label>
            <textarea value={cons} onChange={(e) => setCons(e.target.value)} rows={3} className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-zinc-700 mb-1">Идеально для</label>
            <textarea value={idealFor} onChange={(e) => setIdealFor(e.target.value)} rows={2} className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-zinc-700 mb-1">Не подходит для</label>
            <textarea value={notFor} onChange={(e) => setNotFor(e.target.value)} rows={2} className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-zinc-700 mb-1">Рекомендации</label>
            <textarea value={recommendations} onChange={(e) => setRecommendations(e.target.value)} rows={2} className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </div>

          <div>
            <label className="block text-zinc-700 mb-1">Теги (через запятую)</label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-zinc-700 mb-1">Статья в базе знаний</label>
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
            <span>Подтверждаю права на загружаемые изображения</span>
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
