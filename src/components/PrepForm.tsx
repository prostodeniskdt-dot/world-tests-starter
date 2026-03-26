"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Upload, X, Plus } from "lucide-react";

type IngredientRow = { name: string; amount: string };
type SocialLinks = Record<string, string>;

type Category = { id: number; name: string };

type PrepFormMode = "ugc" | "admin";

type PrepFormData = {
  id?: number;
  category_id: number | "";
  name: string;
  slug: string;
  composition: string;
  ingredients: IngredientRow[];
  tags: string[];
  image_url: string | null;
  photo_rights_confirmed: boolean;
  author: string;
  bar_name: string;
  bar_city: string;
  bar_description: string;
  social_links: SocialLinks;
  is_published?: boolean;
};

const EMPTY: PrepFormData = {
  category_id: "",
  name: "",
  slug: "",
  composition: "",
  ingredients: [],
  tags: [],
  image_url: null,
  photo_rights_confirmed: false,
  author: "",
  bar_name: "",
  bar_city: "",
  bar_description: "",
  social_links: { telegram: "", youtube: "", dzen: "" },
};

function normalizeSocialLinks(raw: unknown): SocialLinks {
  if (!raw || typeof raw !== "object") return { ...EMPTY.social_links };
  const o = raw as Record<string, unknown>;
  return {
    telegram: String(o.telegram ?? "").trim(),
    youtube: String(o.youtube ?? "").trim(),
    dzen: String(o.dzen ?? "").trim(),
  };
}

function normalizeIngredients(raw: unknown): IngredientRow[] {
  if (!Array.isArray(raw)) return [];
  const out: IngredientRow[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const name = String(o.name ?? "").trim();
    const amount = String(o.amount ?? "").trim();
    if (!name && !amount) continue;
    out.push({ name, amount });
    if (out.length >= 40) break;
  }
  return out;
}

function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const t of raw) {
    const s = String(t ?? "").trim().toLowerCase();
    if (!s) continue;
    out.push(s.slice(0, 64));
    if (out.length >= 24) break;
  }
  return Array.from(new Set(out));
}

export function PrepForm({
  mode,
  categories,
  initial,
  uploadEndpoint,
  submitLabel,
  onSubmit,
  canSubmit = true,
  requirePhotoRights = false,
}: {
  mode: PrepFormMode;
  categories: Category[];
  initial?: Record<string, unknown> | null;
  uploadEndpoint: string;
  submitLabel: string;
  onSubmit: (payload: Record<string, unknown>) => Promise<{ ok: boolean; error?: string; id?: number }>;
  canSubmit?: boolean;
  requirePhotoRights?: boolean;
}) {
  const [data, setData] = useState<PrepFormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tagDraft, setTagDraft] = useState("");
  const [ingName, setIngName] = useState("");
  const [ingAmount, setIngAmount] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!initial) return;
    const i = initial as Record<string, unknown>;
    setData({
      ...EMPTY,
      id: i.id != null ? Number(i.id) : undefined,
      category_id:
        i.category_id != null && i.category_id !== "" ? Number(i.category_id) : ("" as const),
      name: String(i.name ?? ""),
      slug: String(i.slug ?? ""),
      composition: String(i.composition ?? ""),
      ingredients: normalizeIngredients(i.ingredients),
      tags: normalizeTags(i.tags),
      image_url: i.image_url != null ? String(i.image_url) : null,
      photo_rights_confirmed: Boolean(i.photo_rights_confirmed),
      author: String(i.author ?? ""),
      bar_name: String(i.bar_name ?? ""),
      bar_city: String(i.bar_city ?? ""),
      bar_description: String(i.bar_description ?? ""),
      social_links: normalizeSocialLinks(i.social_links),
      is_published: i.is_published != null ? Boolean(i.is_published) : undefined,
    });
  }, [initial]);

  const labelCls = "block text-sm font-medium text-zinc-700 mb-1";
  const inputCls =
    "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500";

  const set = <K extends keyof PrepFormData>(key: K, value: PrepFormData[K]) =>
    setData((p) => ({ ...p, [key]: value }));

  const addTag = () => {
    const t = tagDraft.trim().toLowerCase().slice(0, 64);
    if (!t) return;
    if (data.tags.includes(t)) return;
    set("tags", [...data.tags, t].slice(0, 24));
    setTagDraft("");
  };

  const addIngredient = () => {
    const name = ingName.trim().slice(0, 200);
    const amount = ingAmount.trim().slice(0, 120);
    if (!name && !amount) return;
    set("ingredients", [...data.ingredients, { name, amount }].slice(0, 40));
    setIngName("");
    setIngAmount("");
  };

  const setSocialLink = (key: string, val: string) => {
    set("social_links", { ...data.social_links, [key]: val });
  };

  const canUpload = useMemo(() => Boolean(uploadEndpoint), [uploadEndpoint]);

  const uploadImage = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(uploadEndpoint, { method: "POST", body: fd, credentials: "same-origin" });
      const json = await res.json();
      if (!json?.ok || !json?.url) {
        setError(json?.error || "Ошибка загрузки изображения");
        return;
      }
      set("image_url", String(json.url));
    } catch {
      setError("Не удалось загрузить изображение");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async () => {
    setError(null);
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...data,
        category_id: data.category_id === "" ? null : data.category_id,
      };
      const res = await onSubmit(payload);
      if (!res.ok) {
        setError(res.error || "Ошибка");
        return;
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit || saving) return;
        submit();
      }}
    >
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900">Основное</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Название</label>
            <input value={data.name} onChange={(e) => set("name", e.target.value)} className={`${inputCls} w-full`} />
          </div>
          <div>
            <label className={labelCls}>Категория</label>
            <select
              value={data.category_id === "" ? "" : String(data.category_id)}
              onChange={(e) => set("category_id", e.target.value ? Number(e.target.value) : "")}
              className={`${inputCls} w-full`}
            >
              <option value="">Выберите категорию</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Slug (URL)</label>
          <input
            value={data.slug}
            onChange={(e) => set("slug", e.target.value)}
            placeholder="Если пусто — будет сгенерирован"
            className={`${inputCls} w-full`}
          />
        </div>

        <div>
          <label className={labelCls}>Состав</label>
          <textarea
            value={data.composition}
            onChange={(e) => set("composition", e.target.value)}
            rows={4}
            className={`${inputCls} w-full`}
          />
        </div>
      </section>

      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900">Ингредиенты</h2>

        {data.ingredients.length > 0 && (
          <div className="rounded-xl border border-zinc-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="text-left px-4 py-2 text-zinc-600 font-medium">Ингредиент</th>
                  <th className="text-left px-4 py-2 text-zinc-600 font-medium w-40">Количество</th>
                  <th className="px-4 py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {data.ingredients.map((r, idx) => (
                  <tr key={idx} className="border-t border-zinc-200">
                    <td className="px-4 py-2 text-zinc-900">{r.name || "—"}</td>
                    <td className="px-4 py-2 text-zinc-700">{r.amount || "—"}</td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-red-50 text-zinc-400 hover:text-red-600"
                        onClick={() => set("ingredients", data.ingredients.filter((_, i) => i !== idx))}
                        aria-label="Удалить ингредиент"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            value={ingName}
            onChange={(e) => setIngName(e.target.value)}
            placeholder="Ингредиент"
            className={`${inputCls} w-full`}
          />
          <input
            value={ingAmount}
            onChange={(e) => setIngAmount(e.target.value)}
            placeholder="Количество"
            className={`${inputCls} w-full`}
          />
          <button
            type="button"
            onClick={addIngredient}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            <Plus className="h-4 w-4" />
            Добавить
          </button>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900">Теги</h2>
        <div className="flex flex-wrap gap-2">
          {data.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 text-zinc-700 text-sm">
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

      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900">Автор и бар</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Автор</label>
            <input value={data.author} onChange={(e) => set("author", e.target.value)} className={`${inputCls} w-full`} />
          </div>
          <div>
            <label className={labelCls}>Бар</label>
            <input value={data.bar_name} onChange={(e) => set("bar_name", e.target.value)} className={`${inputCls} w-full`} />
          </div>
          <div>
            <label className={labelCls}>Город</label>
            <input value={data.bar_city} onChange={(e) => set("bar_city", e.target.value)} className={`${inputCls} w-full`} />
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

      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900">Фото</h2>
        {!data.image_url ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-4">
            <div className="flex items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={!canUpload || uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f);
                }}
                className="block w-full text-sm text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              {uploading ? <Loader2 className="h-4 w-4 animate-spin text-zinc-400" /> : <Upload className="h-4 w-4 text-zinc-400" />}
            </div>
            <p className="text-xs text-zinc-500 mt-2">Фото опционально. Поддерживаются JPEG/PNG/WebP.</p>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.image_url} alt="Фото" className="h-24 w-24 object-cover rounded-lg border border-zinc-200" />
            <button
              type="button"
              className="text-sm text-red-600 hover:underline"
              onClick={() => set("image_url", null)}
              disabled={uploading}
            >
              Удалить фото
            </button>
          </div>
        )}

        {requirePhotoRights && (
          <label className="flex items-start gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={data.photo_rights_confirmed}
              onChange={(e) => set("photo_rights_confirmed", e.target.checked)}
              className="mt-1"
            />
            <span>
              Я подтверждаю права на фото (использую только свои материалы или имею полное разрешение на публикацию).
            </span>
          </label>
        )}
      </section>

      {mode === "admin" && (
        <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-3">
          <h2 className="font-semibold text-zinc-900">Публикация</h2>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={data.is_published !== false}
              onChange={(e) => set("is_published", e.target.checked)}
            />
            Опубликовано
          </label>
        </section>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit || saving || uploading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {(saving || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>

      {mode === "ugc" && requirePhotoRights && !data.photo_rights_confirmed && (
        <p className="text-xs text-zinc-500">
          Перед отправкой на модерацию нужно подтвердить права на фото (даже если фото не прикреплено).
        </p>
      )}
    </form>
  );
}

