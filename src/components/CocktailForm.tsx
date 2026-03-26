"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { slugify } from "@/lib/slugify";

export type CocktailIngredient = {
  name: string;
  amount: string;
};

export type CocktailFormMode = "ugc" | "admin";

export type CocktailCategory = { id: number; name: string };

export type CocktailFormData = {
  name: string;
  slug: string;
  description: string;
  method: string;
  glass: string;
  garnish: string;
  ice: string;
  ingredients: CocktailIngredient[];
  instructions: string;
  cordials_recipe: string;
  image_url: string | null;
  gallery_urls: string[];
  history: string;
  allergens: string;
  strength_scale: number | "";
  taste_sweet_dry_scale: number | "";
  nutrition_note: string;
  alcohol_content_note: string;
  tags: string[];
  // author & bar
  author: string;
  classic_original_author: string;
  bar_name: string;
  bar_city: string;
  bar_description: string;
  social_links: Record<string, string>;
  // admin-only fields
  category_id: number | null;
  is_classic: boolean;
  is_published: boolean;
};

const EMPTY: CocktailFormData = {
  name: "",
  slug: "",
  description: "",
  method: "",
  glass: "",
  garnish: "",
  ice: "",
  ingredients: [{ name: "", amount: "" }],
  instructions: "",
  cordials_recipe: "",
  image_url: null,
  gallery_urls: [],
  history: "",
  allergens: "",
  strength_scale: "",
  taste_sweet_dry_scale: "",
  nutrition_note: "",
  alcohol_content_note: "",
  tags: [],
  author: "",
  classic_original_author: "",
  bar_name: "",
  bar_city: "",
  bar_description: "",
  social_links: { telegram: "", youtube: "", dzen: "" },
  category_id: null,
  is_classic: false,
  is_published: true,
};

function asString(v: unknown): string {
  return v == null ? "" : String(v);
}

function toNumberOrEmpty(v: unknown): number | "" {
  if (v == null || v === "") return "";
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
}

function normalizeIngredients(raw: unknown): CocktailIngredient[] {
  if (!Array.isArray(raw)) return [...EMPTY.ingredients];
  const out: CocktailIngredient[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    out.push({
      name: asString(r.name),
      amount: asString(r.amount),
    });
  }
  return out.length > 0 ? out : [...EMPTY.ingredients];
}

function normalizeGallery(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((u) => typeof u === "string" && u.trim()).map(String).slice(0, 12);
}

function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 24);
}

function normalizeSocialLinks(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return { ...EMPTY.social_links };
  const o = raw as Record<string, unknown>;
  return {
    telegram: asString(o.telegram || ""),
    youtube: asString(o.youtube || ""),
    dzen: asString(o.dzen || ""),
    ...Object.fromEntries(
      Object.entries(o)
        .filter(([k]) => !["telegram", "youtube", "dzen"].includes(k))
        .map(([k, v]) => [k, asString(v)])
    ),
  };
}

export function CocktailForm({
  mode,
  categories,
  initial,
  uploadEndpoint,
  submitLabel,
  onSubmit,
  canSubmit = true,
  onRequireLogin,
  requirePhotoRights = false,
}: {
  mode: CocktailFormMode;
  categories: CocktailCategory[];
  initial?: Record<string, unknown> | null;
  uploadEndpoint: string;
  submitLabel: string;
  onSubmit: (payload: Record<string, unknown>) => Promise<{ ok: boolean; error?: string; id?: number }>;
  canSubmit?: boolean;
  onRequireLogin?: () => void;
  requirePhotoRights?: boolean;
}) {
  const init: CocktailFormData = useMemo(() => {
    if (!initial) return { ...EMPTY };
    return {
      ...EMPTY,
      name: asString(initial.name),
      slug: asString(initial.slug),
      description: asString(initial.description),
      method: asString(initial.method),
      glass: asString(initial.glass),
      garnish: asString(initial.garnish),
      ice: asString(initial.ice),
      ingredients: normalizeIngredients(initial.ingredients),
      instructions: asString(initial.instructions),
      cordials_recipe: asString(initial.cordials_recipe),
      image_url: initial.image_url ? asString(initial.image_url) : null,
      gallery_urls: normalizeGallery(initial.gallery_urls),
      history: asString(initial.history),
      allergens: asString(initial.allergens),
      strength_scale: toNumberOrEmpty(initial.strength_scale),
      taste_sweet_dry_scale: toNumberOrEmpty(initial.taste_sweet_dry_scale),
      nutrition_note: asString(initial.nutrition_note),
      alcohol_content_note: asString(initial.alcohol_content_note),
      tags: normalizeTags(initial.tags),
      author: asString(initial.author),
      classic_original_author: asString(initial.classic_original_author),
      bar_name: asString(initial.bar_name),
      bar_city: asString(initial.bar_city),
      bar_description: asString(initial.bar_description),
      social_links: normalizeSocialLinks(initial.social_links),
      category_id: initial.category_id ? Number(initial.category_id) : null,
      is_classic: initial.is_classic === true,
      is_published: initial.is_published !== false,
    };
  }, [initial]);

  const [data, setData] = useState<CocktailFormData>(init);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSeconds, setUploadSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [photoRights, setPhotoRights] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setData(init);
    setSuccess(false);
    setError(null);
  }, [init]);

  useEffect(() => {
    if (!uploading) {
      setUploadSeconds(0);
      return;
    }
    setUploadSeconds(0);
    const id = window.setInterval(() => setUploadSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [uploading]);

  const inputCls =
    "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";
  const labelCls = "block text-sm font-medium text-zinc-700 mb-1";

  const set = <K extends keyof CocktailFormData>(key: K, val: CocktailFormData[K]) =>
    setData((prev) => ({ ...prev, [key]: val }));

  const setIngredient = (idx: number, patch: Partial<CocktailIngredient>) => {
    setData((prev) => {
      const next = [...prev.ingredients];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, ingredients: next };
    });
  };

  const addIngredient = () =>
    set("ingredients", [...data.ingredients, { name: "", amount: "" }]);

  const removeIngredient = (idx: number) =>
    set("ingredients", data.ingredients.filter((_, i) => i !== idx));

  const addTag = () => {
    const t = tagDraft.trim();
    if (t && !data.tags.includes(t)) {
      set("tags", [...data.tags, t]);
      setTagDraft("");
    }
  };

  const setSocialLink = (key: string, val: string) =>
    set("social_links", { ...data.social_links, [key]: val });

  const uploadFile = async (file: File, asGallery: boolean) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 30_000);
      const res = await fetch(uploadEndpoint, {
        method: "POST",
        body: fd,
        credentials: "same-origin",
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);
      const json = await res.json();
      const url = json?.url ? String(json.url) : null;
      if (json?.ok && url) {
        if (asGallery) {
          set("gallery_urls", [...data.gallery_urls, url].slice(0, 12));
        } else {
          set("image_url", url);
        }
      } else {
        const timingHint =
          json?.timing?.totalMs != null ? ` (сервер: ${Math.round(Number(json.timing.totalMs))} мс)` : "";
        setError((json?.error || "Не удалось загрузить изображение") + timingHint);
      }
    } catch {
      setError("Загрузка не завершилась (таймаут/сеть/сервер). Попробуйте ещё раз.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!canSubmit) {
      onRequireLogin?.();
      return;
    }
    if (requirePhotoRights && !photoRights) {
      setError("Подтвердите права на фотографии");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    const cleanedIngredients = data.ingredients
      .filter((r) => r.name.trim() || r.amount.trim())
      .map((r) => ({ name: r.name.trim(), amount: r.amount.trim() }));

    const payload: Record<string, unknown> = {
      name: data.name.trim(),
      slug: (data.slug.trim() || slugify(data.name.trim()) || "").trim(),
      description: data.description.trim() || null,
      method: data.method.trim() || null,
      glass: data.glass.trim() || null,
      garnish: data.garnish.trim() || null,
      ice: data.ice.trim() || null,
      ingredients: cleanedIngredients,
      instructions: data.instructions.trim() || null,
      cordials_recipe: data.cordials_recipe.trim() || null,
      image_url: data.image_url || null,
      gallery_urls: data.gallery_urls,
      history: data.history.trim() || null,
      allergens: data.allergens.trim() || null,
      strength_scale: data.strength_scale === "" ? null : data.strength_scale,
      taste_sweet_dry_scale: data.taste_sweet_dry_scale === "" ? null : data.taste_sweet_dry_scale,
      nutrition_note: data.nutrition_note.trim() || null,
      alcohol_content_note: data.alcohol_content_note.trim() || null,
      tags: data.tags,
      author: data.author.trim() || null,
      classic_original_author: data.classic_original_author.trim() || null,
      bar_name: data.bar_name.trim() || null,
      bar_city: data.bar_city.trim() || null,
      bar_description: data.bar_description.trim() || null,
      social_links: data.social_links,
    };

    if (mode === "admin") {
      payload.category_id = data.category_id;
      payload.is_published = data.is_published;
    }
    payload.is_classic = data.is_classic;
    if (mode === "ugc") {
      payload.photo_rights_confirmed = true;
    }

    try {
      const res = await onSubmit(payload);
      if (res.ok) setSuccess(true);
      else setError(res.error || "Ошибка сохранения");
    } catch {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Сохранено
        </div>
      )}

      {/* Основное */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900">Основное</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Название *</label>
            <input value={data.name} onChange={(e) => set("name", e.target.value)} className={`${inputCls} w-full`} />
          </div>
          <div>
            <label className={labelCls}>Slug</label>
            <input
              value={data.slug}
              onChange={(e) => set("slug", e.target.value)}
              className={`${inputCls} w-full`}
              placeholder="Авто из названия"
            />
          </div>
          {mode === "admin" && (
            <div>
              <label className={labelCls}>Категория</label>
              <select
                value={data.category_id ?? ""}
                onChange={(e) => set("category_id", e.target.value ? Number(e.target.value) : null)}
                className={`${inputCls} w-full`}
              >
                <option value="">Без категории</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {mode === "admin" && (
            <div className="flex gap-6 items-center pt-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={data.is_classic}
                  onChange={(e) => set("is_classic", e.target.checked)}
                  className="rounded"
                />
                Классический (IBA)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={data.is_published}
                  onChange={(e) => set("is_published", e.target.checked)}
                  className="rounded"
                />
                Опубликован
              </label>
            </div>
          )}
          {mode === "ugc" && (
            <div className="pt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={data.is_classic}
                  onChange={(e) => set("is_classic", e.target.checked)}
                  className="rounded"
                />
                Это классический рецепт (не авторский)
              </label>
            </div>
          )}
        </div>
        <div>
          <label className={labelCls}>Описание</label>
          <textarea
            value={data.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            className={`${inputCls} w-full`}
          />
        </div>
      </section>

      {/* Рецепт */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900">Рецепт</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Метод</label>
            <input value={data.method} onChange={(e) => set("method", e.target.value)} className={`${inputCls} w-full`} />
          </div>
          <div>
            <label className={labelCls}>Бокал</label>
            <input value={data.glass} onChange={(e) => set("glass", e.target.value)} className={`${inputCls} w-full`} />
          </div>
          <div>
            <label className={labelCls}>Гарнир</label>
            <input value={data.garnish} onChange={(e) => set("garnish", e.target.value)} className={`${inputCls} w-full`} />
          </div>
          <div>
            <label className={labelCls}>Лёд</label>
            <input value={data.ice} onChange={(e) => set("ice", e.target.value)} className={`${inputCls} w-full`} />
          </div>
        </div>
      </section>

      {/* Ингредиенты */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900">Ингредиенты</h2>
          <button
            onClick={addIngredient}
            type="button"
            className="text-sm text-primary-600 hover:underline inline-flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Добавить
          </button>
        </div>
        <div className="space-y-3">
          {data.ingredients.map((ing, i) => (
            <div key={i} className="rounded-lg border border-zinc-100 p-3 bg-zinc-50/50">
              <div className="flex gap-2 items-start">
                <input
                  placeholder="Количество (например: 45 мл, 1 дэш, 10 гр)"
                  value={ing.amount}
                  onChange={(e) => setIngredient(i, { amount: e.target.value })}
                  className={`${inputCls} flex-none w-40 sm:w-48`}
                />
                <input
                  placeholder="Название ингредиента"
                  value={ing.name}
                  onChange={(e) => setIngredient(i, { name: e.target.value })}
                  className={`${inputCls} flex-1 min-w-0 w-full`}
                />
                {data.ingredients.length > 1 && (
                  <button
                    onClick={() => removeIngredient(i)}
                    type="button"
                    className="text-zinc-400 hover:text-red-600 px-2 pt-2"
                    aria-label="Удалить строку"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Приготовление */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900">Приготовление</h2>
        <div>
          <label className={labelCls}>Инструкция</label>
          <textarea
            value={data.instructions}
            onChange={(e) => set("instructions", e.target.value)}
            rows={5}
            className={`${inputCls} w-full`}
          />
        </div>
        <div>
          <label className={labelCls}>Дополнительно (кордиалы и т.д.)</label>
          <textarea
            value={data.cordials_recipe}
            onChange={(e) => set("cordials_recipe", e.target.value)}
            rows={2}
            className={`${inputCls} w-full`}
          />
        </div>
      </section>

      {/* Автор и бар */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900">
          {data.is_classic ? "Источник и автор классики" : "Автор и бар"}
        </h2>
        {data.is_classic && (
          <div>
            <label className={labelCls}>Автор оригинального классического рецепта</label>
            <input
              value={data.classic_original_author}
              onChange={(e) => set("classic_original_author", e.target.value)}
              placeholder="Например: Jerry Thomas"
              className={`${inputCls} w-full`}
            />
          </div>
        )}
        <p className="text-xs text-zinc-500">
          {data.is_classic
            ? "Кто нашел и загрузил этот классический рецепт на сайт."
            : "Данные автора авторского рецепта и бара."}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{data.is_classic ? "Рецепт нашел и загрузил" : "Автор"}</label>
            <input value={data.author} onChange={(e) => set("author", e.target.value)} className={`${inputCls} w-full`} />
          </div>
          <div>
            <label className={labelCls}>Бар</label>
            <input
              value={data.bar_name}
              onChange={(e) => set("bar_name", e.target.value)}
              className={`${inputCls} w-full`}
            />
          </div>
          <div>
            <label className={labelCls}>Город</label>
            <input
              value={data.bar_city}
              onChange={(e) => set("bar_city", e.target.value)}
              className={`${inputCls} w-full`}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Описание бара</label>
          <textarea
            value={data.bar_description}
            onChange={(e) => set("bar_description", e.target.value)}
            rows={2}
            className={`${inputCls} w-full`}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700">Ссылки автора</p>
          {["telegram", "youtube", "dzen"].map((key) => (
            <div key={key} className="flex gap-2 items-center">
              <span className="text-sm text-zinc-500 w-20 capitalize">{key}</span>
              <input
                value={data.social_links[key] || ""}
                onChange={(e) => setSocialLink(key, e.target.value)}
                placeholder="https://..."
                className={`${inputCls} w-full flex-1`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Дополнительно */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900">Дополнительно</h2>
        <div>
          <label className={labelCls}>История</label>
          <textarea value={data.history} onChange={(e) => set("history", e.target.value)} rows={3} className={`${inputCls} w-full`} />
        </div>
        <div>
          <label className={labelCls}>Аллергены</label>
          <textarea value={data.allergens} onChange={(e) => set("allergens", e.target.value)} rows={2} className={`${inputCls} w-full`} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Крепость (0–10)</label>
            <input
              type="number"
              min={0}
              max={10}
              value={data.strength_scale}
              onChange={(e) => set("strength_scale", e.target.value === "" ? "" : Number(e.target.value))}
              className={`${inputCls} w-full`}
            />
          </div>
          <div>
            <label className={labelCls}>Баланс сладости (0–10)</label>
            <input
              type="number"
              min={0}
              max={10}
              value={data.taste_sweet_dry_scale}
              onChange={(e) =>
                set("taste_sweet_dry_scale", e.target.value === "" ? "" : Number(e.target.value))
              }
              className={`${inputCls} w-full`}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Питание</label>
          <textarea
            value={data.nutrition_note}
            onChange={(e) => set("nutrition_note", e.target.value)}
            rows={2}
            className={`${inputCls} w-full`}
          />
        </div>
        <div>
          <label className={labelCls}>Содержание алкоголя</label>
          <textarea
            value={data.alcohol_content_note}
            onChange={(e) => set("alcohol_content_note", e.target.value)}
            rows={2}
            className={`${inputCls} w-full`}
          />
        </div>
      </section>

      {/* Теги */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900">Теги</h2>
        <div className="flex flex-wrap gap-2">
          {data.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 text-zinc-700 text-sm"
            >
              {tag}
              <button
                onClick={() => set("tags", data.tags.filter((t) => t !== tag))}
                type="button"
                className="text-zinc-400 hover:text-red-500"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="Новый тег"
            className={`${inputCls} w-full max-w-xs`}
          />
          <button onClick={addTag} type="button" className="text-sm text-primary-600 hover:underline">
            Добавить
          </button>
        </div>
      </section>

      {/* Фото */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900">Фото</h2>
          {uploading && (
            <span className="text-xs text-zinc-500">
              Загрузка… {uploadSeconds > 0 ? `${uploadSeconds}с` : ""}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 cursor-pointer hover:bg-zinc-50 text-sm">
            <ImagePlus className="h-4 w-4" />
            Главное фото
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f, false);
                e.target.value = "";
              }}
            />
          </label>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 cursor-pointer hover:bg-zinc-50 text-sm">
            В галерею
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f, true);
                e.target.value = "";
              }}
            />
          </label>
          {mode === "admin" && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadFile(f, false);
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline"
              >
                <Upload className="h-4 w-4" />
                Загрузить (альтернатива)
              </button>
            </>
          )}
        </div>
        {data.image_url && (
          <div className="flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.image_url}
              alt=""
              className="h-24 w-24 object-cover rounded-lg border border-zinc-200"
            />
            <button
              type="button"
              onClick={() => set("image_url", null)}
              className="text-sm text-red-600 hover:underline"
            >
              Убрать главное
            </button>
          </div>
        )}
        {data.gallery_urls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.gallery_urls.map((u, idx) => (
              <div key={u} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="h-16 w-16 object-cover rounded border" />
                <button
                  type="button"
                  onClick={() => set("gallery_urls", data.gallery_urls.filter((_, j) => j !== idx))}
                  className="absolute -top-2 -right-2 bg-white border rounded-full w-5 h-5 text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {requirePhotoRights && (
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={photoRights}
            onChange={(e) => setPhotoRights(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm text-zinc-700">
            Подтверждаю: использую только фото без нарушения авторских прав или даю полное разрешение на
            публикацию своих снимков на сайте.
          </span>
        </label>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={saving || uploading}
        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 text-white px-6 py-3 font-medium hover:bg-primary-700 disabled:opacity-50"
      >
        {(saving || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitLabel}
      </button>
    </div>
  );
}

