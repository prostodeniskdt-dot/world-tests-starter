"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Coffee, ImagePlus } from "lucide-react";
import { useLocalUser } from "@/components/UserGate";
import { LoginModal } from "@/components/LoginModal";
import { slugify } from "@/lib/slugify";
import { NA_CATEGORY_CONFIG, type NaFieldDef } from "@/lib/naCategoryConfig";

const FLAVOR_KEYS = [
  { key: "sweetness", label: "Сладость" },
  { key: "acidity", label: "Кислотность" },
  { key: "bitterness", label: "Горечь" },
  { key: "aromatic", label: "Аромат / интенсивность" },
  { key: "body", label: "Тело / насыщенность" },
] as const;

type Category = { id: number; name: string; slug: string };

function SpecificFieldInput({
  def,
  value,
  onChange,
}: {
  def: NaFieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const base = "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white";
  if (def.type === "boolean") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={base}>
        <option value="">— не указано —</option>
        <option value="true">Да</option>
        <option value="false">Нет</option>
      </select>
    );
  }
  if (def.type === "select" && def.options) {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={base}>
        <option value="">— выберите —</option>
        {def.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (def.type === "number") {
    return (
      <input
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={base}
      />
    );
  }
  return (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={base} />
  );
}

function buildCategorySpecificFromState(
  categorySlug: string,
  state: Record<string, string>
): Record<string, unknown> {
  const cfg = NA_CATEGORY_CONFIG[categorySlug];
  if (!cfg?.fields.length) return {};
  const out: Record<string, unknown> = {};
  for (const f of cfg.fields) {
    const s = (state[f.key] ?? "").trim();
    if (s === "") continue;
    if (f.type === "boolean") {
      if (s === "true") out[f.key] = true;
      else if (s === "false") out[f.key] = false;
    } else if (f.type === "number") {
      const n = parseFloat(s.replace(",", "."));
      if (!Number.isNaN(n)) out[f.key] = n;
    } else {
      const max = f.maxLen ?? 2000;
      out[f.key] = s.slice(0, max);
    }
  }
  return out;
}

export default function NASubmitPage() {
  const { user } = useLocalUser();
  const [showAuth, setShowAuth] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<{ id: number; title: string; slug: string }[]>([]);
  const [tests, setTests] = useState<{ id: string; title: string }[]>([]);

  const [categoryId, setCategoryId] = useState<number | "">("");
  const [specificState, setSpecificState] = useState<Record<string, string>>({});
  const [extraNotes, setExtraNotes] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [subcategoryText, setSubcategoryText] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [description, setDescription] = useState("");
  const [producer, setProducer] = useState("");
  const [country, setCountry] = useState("");
  const [amountNumeric, setAmountNumeric] = useState("");
  const [amountUnit, setAmountUnit] = useState("");
  const [tasteDescription, setTasteDescription] = useState("");
  const [flavorValues, setFlavorValues] = useState<Record<string, string>>({});
  const [usageDrinks, setUsageDrinks] = useState("");
  const [usageFood, setUsageFood] = useState("");
  const [aboutBrand, setAboutBrand] = useState("");
  const [interestingFacts, setInterestingFacts] = useState("");
  const [practiceTestId, setPracticeTestId] = useState("");
  const [relatedArticleId, setRelatedArticleId] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoRights, setPhotoRights] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const categorySlug = useMemo(() => {
    if (categoryId === "") return "";
    return categories.find((c) => c.id === categoryId)?.slug ?? "";
  }, [categories, categoryId]);

  const cfg = categorySlug ? NA_CATEGORY_CONFIG[categorySlug] : null;

  useEffect(() => {
    setSpecificState({});
    setExtraNotes("");
  }, [categorySlug]);

  useEffect(() => {
    fetch("/api/na/categories", { credentials: "same-origin" })
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

  useEffect(() => {
    if (!user) return;
    fetch("/api/tests", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.tests))
          setTests(d.tests.map((t: { id: string; title: string }) => ({ id: t.id, title: t.title })));
      })
      .catch(() => {});
  }, [user]);

  const setSpecific = useCallback((key: string, v: string) => {
    setSpecificState((prev) => ({ ...prev, [key]: v }));
  }, []);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/na/upload-image", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.ok && data.url) setImageUrl(data.url);
      else setError(data.error || "Не удалось загрузить изображение");
    } catch {
      setError("Ошибка сети при загрузке");
    } finally {
      setUploading(false);
    }
  };

  const flavorPayload = (): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const { key } of FLAVOR_KEYS) {
      const s = (flavorValues[key] ?? "").trim();
      if (s === "") continue;
      const n = parseInt(s, 10);
      if (n >= 0 && n <= 100) out[key] = n;
    }
    return out;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (!photoRights) {
      setError("Подтвердите права на фотографии");
      return;
    }
    if (categoryId === "") {
      setError("Выберите категорию ингредиента");
      return;
    }

    const slugFinal = slugify((slug.trim() || slugify(name.trim()) || "").trim());
    if (!slugFinal) {
      setError("Укажите slug URL");
      return;
    }

    const tags = tagsInput
      .split(/[,;]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const category_specific = buildCategorySpecificFromState(categorySlug, specificState);

    const body: Record<string, unknown> = {
      name: name.trim(),
      slug: slugFinal,
      category_id: categoryId,
      subcategory_text: trimOrNull(subcategoryText),
      tags,
      description: trimOrNull(description),
      producer: trimOrNull(producer),
      country: trimOrNull(country),
      amount_numeric: amountNumeric.trim() === "" ? null : amountNumeric,
      amount_unit: trimOrNull(amountUnit),
      taste_description: trimOrNull(tasteDescription),
      flavor_profile: flavorPayload(),
      usage_in_drinks: trimOrNull(usageDrinks),
      usage_in_food: trimOrNull(usageFood),
      about_brand: trimOrNull(aboutBrand),
      interesting_facts: trimOrNull(interestingFacts),
      category_specific,
      practice_test_id: practiceTestId.trim() || null,
      related_knowledge_article_id: relatedArticleId.trim() || null,
      image_url: imageUrl,
      photo_rights_confirmed: true,
    };

    if (cfg?.extraOnly) {
      body.extra_notes = extraNotes.trim() || null;
    } else if (extraNotes.trim()) {
      body.extra_notes = extraNotes.trim();
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/na/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Не удалось отправить");
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
        href="/na"
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Каталог Б/А
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <Coffee className="h-8 w-8 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Предложить карточку Б/А</h1>
          <p className="text-sm text-zinc-600">Заявка уйдёт на модерацию</p>
        </div>
      </div>

      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 text-green-900 px-4 py-3 text-sm">
          Спасибо! Заявка отправлена. После проверки карточка появится в каталоге.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
              {error}
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Категория <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={categoryId === "" ? "" : String(categoryId)}
              onChange={(e) =>
                setCategoryId(e.target.value === "" ? "" : parseInt(e.target.value, 10))
              }
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white"
            >
              <option value="">— выберите —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Название <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Slug URL <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="латиница-или-кириллица"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Подкатегория (текст)</label>
            <input
              value={subcategoryText}
              onChange={(e) => setSubcategoryText(e.target.value)}
              placeholder="Например: фруктовый сироп"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Теги (через запятую)</label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="фруктовый, ваниль, осень"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Краткое описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Фото продукта</label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 cursor-pointer hover:bg-zinc-50 text-sm">
                <ImagePlus className="h-4 w-4" />
                {uploading ? "Загрузка…" : "Выбрать файл"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadFile(f);
                    e.target.value = "";
                  }}
                />
              </label>
              {imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={imageUrl} alt="" className="h-16 w-16 rounded object-cover border" />
              ) : null}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Производитель / бренд</label>
              <input
                value={producer}
                onChange={(e) => setProducer(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Страна</label>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Объём / вес (число)</label>
              <input
                value={amountNumeric}
                onChange={(e) => setAmountNumeric(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Единица (мл, г, л…)</label>
              <input
                value={amountUnit}
                onChange={(e) => setAmountUnit(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Вкус (свободный текст)</label>
            <textarea
              value={tasteDescription}
              onChange={(e) => setTasteDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-800 mb-2">Вкусовой профиль (оценка 0–100)</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {FLAVOR_KEYS.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-zinc-600 mb-0.5">{label}</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={flavorValues[key] ?? ""}
                    onChange={(e) =>
                      setFlavorValues((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Применение в напитках</label>
            <textarea
              value={usageDrinks}
              onChange={(e) => setUsageDrinks(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Применение в еде</label>
            <textarea
              value={usageFood}
              onChange={(e) => setUsageFood(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          {cfg?.extraOnly ? (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Доп. характеристики (свободный текст)
              </label>
              <textarea
                value={extraNotes}
                onChange={(e) => setExtraNotes(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          ) : cfg?.fields.length ? (
            <div className="border border-zinc-200 rounded-xl p-4 space-y-4 bg-zinc-50/50">
              <p className="text-sm font-semibold text-zinc-900">Поля категории «{cfg.label}»</p>
              {cfg.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm text-zinc-700 mb-1">{field.label}</label>
                  <SpecificFieldInput
                    def={field}
                    value={specificState[field.key] ?? ""}
                    onChange={(v) => setSpecific(field.key, v)}
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm text-zinc-700 mb-1">Доп. заметки (в category_extra)</label>
                <textarea
                  value={extraNotes}
                  onChange={(e) => setExtraNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white"
                />
              </div>
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">О бренде</label>
            <textarea
              value={aboutBrand}
              onChange={(e) => setAboutBrand(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Это интересно</label>
            <textarea
              value={interestingFacts}
              onChange={(e) => setInterestingFacts(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Статья в базе знаний</label>
              <select
                value={relatedArticleId}
                onChange={(e) => setRelatedArticleId(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">— нет —</option>
                {articles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Тест для закрепления</label>
              <select
                value={practiceTestId}
                onChange={(e) => setPracticeTestId(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">— нет —</option>
                {tests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm text-zinc-700 cursor-pointer">
            <input
              type="checkbox"
              checked={photoRights}
              onChange={(e) => setPhotoRights(e.target.checked)}
              className="mt-1"
            />
            <span>
              Подтверждаю права на фото: только свои материалы или разрешение на публикацию.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto rounded-lg bg-primary-600 text-white px-6 py-3 text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? "Отправка…" : "Отправить на модерацию"}
          </button>
        </form>
      )}
    </div>
  );
}

function trimOrNull(s: string): string | null {
  const t = s.trim();
  return t ? t : null;
}
