"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";

type Ingredient = { name: string; amount: string; alcohol_product_slug?: string; na_product_slug?: string };
type Category = { id: number; name: string };

interface CocktailData {
  id?: number;
  name: string;
  slug: string;
  category_id: number | null;
  description: string;
  method: string;
  glass: string;
  garnish: string;
  ice: string;
  ingredients: Ingredient[];
  instructions: string;
  cordials_recipe: string;
  image_url: string;
  gallery_urls: string[];
  strength_scale: number | "";
  taste_sweet_dry_scale: number | "";
  flavor_profile: Record<string, number>;
  history: string;
  allergens: string;
  nutrition_note: string;
  alcohol_content_note: string;
  author: string;
  bar_name: string;
  bar_city: string;
  bar_description: string;
  social_links: Record<string, string>;
  tags: string[];
  is_classic: boolean;
  is_published: boolean;
}

const EMPTY: CocktailData = {
  name: "", slug: "", category_id: null, description: "", method: "", glass: "",
  garnish: "", ice: "", ingredients: [], instructions: "", cordials_recipe: "",
  image_url: "", gallery_urls: [], strength_scale: "", taste_sweet_dry_scale: "",
  flavor_profile: {}, history: "", allergens: "", nutrition_note: "",
  alcohol_content_note: "", author: "", bar_name: "", bar_city: "", bar_description: "",
  social_links: {}, tags: [], is_classic: false, is_published: true,
};

export function AdminCocktailEditForm({
  initial,
  categories,
  mode,
}: {
  initial?: Record<string, unknown>;
  categories: Category[];
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const init: CocktailData = initial
    ? {
        ...EMPTY,
        ...Object.fromEntries(
          Object.entries(initial).map(([k, v]) => [k, v ?? EMPTY[k as keyof CocktailData] ?? ""])
        ),
        ingredients: Array.isArray(initial.ingredients) ? initial.ingredients as Ingredient[] : [],
        gallery_urls: Array.isArray(initial.gallery_urls) ? (initial.gallery_urls as string[]) : [],
        tags: Array.isArray(initial.tags) ? (initial.tags as string[]) : [],
        social_links: initial.social_links && typeof initial.social_links === "object" ? (initial.social_links as Record<string, string>) : {},
        flavor_profile: initial.flavor_profile && typeof initial.flavor_profile === "object" ? (initial.flavor_profile as Record<string, number>) : {},
        strength_scale: initial.strength_scale != null && initial.strength_scale !== "" ? Number(initial.strength_scale) : "",
        taste_sweet_dry_scale: initial.taste_sweet_dry_scale != null && initial.taste_sweet_dry_scale !== "" ? Number(initial.taste_sweet_dry_scale) : "",
        is_classic: initial.is_classic === true,
        is_published: initial.is_published !== false,
        category_id: initial.category_id ? Number(initial.category_id) : null,
      }
    : EMPTY;

  const [data, setData] = useState<CocktailData>(init);
  const [tagDraft, setTagDraft] = useState("");

  const set = <K extends keyof CocktailData>(key: K, val: CocktailData[K]) =>
    setData((prev) => ({ ...prev, [key]: val }));

  const setIngredient = (idx: number, field: keyof Ingredient, val: string) => {
    const next = [...data.ingredients];
    next[idx] = { ...next[idx], [field]: val };
    set("ingredients", next);
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

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.ok && json.url) {
        set("image_url", json.url);
      } else {
        setError(json.error || "Ошибка загрузки фото");
      }
    } catch {
      setError("Ошибка загрузки фото");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const url = mode === "edit" ? `/api/admin/cocktails/${initial?.id}` : "/api/admin/cocktails";
    const method = mode === "edit" ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.ok) {
        setSuccess(true);
        if (mode === "create" && json.id) {
          router.push(`/admin/cocktails/${json.id}/edit`);
        }
      } else {
        setError(json.error || "Ошибка сохранения");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Удалить коктейль? Это действие нельзя отменить.")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/cocktails/${initial?.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) router.push("/admin/cocktails");
      else setError(json.error || "Ошибка удаления");
    } catch {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";
  const labelCls = "block text-sm font-medium text-zinc-700 mb-1";

  return (
    <div className="space-y-6">
      {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">Сохранено!</div>}

      {/* Основное */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900">Основное</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Название *</label>
            <input value={data.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Slug</label>
            <input value={data.slug} onChange={(e) => set("slug", e.target.value)} className={inputCls} placeholder="Авто из названия" />
          </div>
          <div>
            <label className={labelCls}>Категория</label>
            <select
              value={data.category_id ?? ""}
              onChange={(e) => set("category_id", e.target.value ? Number(e.target.value) : null)}
              className={inputCls}
            >
              <option value="">Без категории</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-6 items-center pt-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={data.is_classic} onChange={(e) => set("is_classic", e.target.checked)} className="rounded" />
              Классический (IBA)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={data.is_published} onChange={(e) => set("is_published", e.target.checked)} className="rounded" />
              Опубликован
            </label>
          </div>
        </div>
        <div>
          <label className={labelCls}>Описание</label>
          <textarea value={data.description} onChange={(e) => set("description", e.target.value)} rows={3} className={inputCls} />
        </div>
      </section>

      {/* Рецепт */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900">Рецепт</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Метод</label>
            <input value={data.method} onChange={(e) => set("method", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Бокал</label>
            <input value={data.glass} onChange={(e) => set("glass", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Гарнир</label>
            <input value={data.garnish} onChange={(e) => set("garnish", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Лёд</label>
            <input value={data.ice} onChange={(e) => set("ice", e.target.value)} className={inputCls} />
          </div>
        </div>
      </section>

      {/* Ингредиенты */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900">Ингредиенты</h2>
          <button onClick={addIngredient} type="button" className="text-sm text-primary-600 hover:underline inline-flex items-center gap-1">
            <Plus className="h-3.5 w-3.5" /> Добавить
          </button>
        </div>
        {data.ingredients.length === 0 && <p className="text-sm text-zinc-400">Нет ингредиентов</p>}
        <div className="space-y-2">
          {data.ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input placeholder="Кол-во" value={ing.amount} onChange={(e) => setIngredient(i, "amount", e.target.value)} className={`${inputCls} w-28`} />
              <input placeholder="Название" value={ing.name} onChange={(e) => setIngredient(i, "name", e.target.value)} className={`${inputCls} flex-1`} />
              <button onClick={() => removeIngredient(i)} type="button" className="text-red-400 hover:text-red-600 p-2">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Приготовление */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900">Приготовление</h2>
        <div>
          <label className={labelCls}>Инструкция</label>
          <textarea value={data.instructions} onChange={(e) => set("instructions", e.target.value)} rows={4} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Рецепт кордиала</label>
          <textarea value={data.cordials_recipe} onChange={(e) => set("cordials_recipe", e.target.value)} rows={3} className={inputCls} />
        </div>
      </section>

      {/* Медиа */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900">Фото</h2>
        <div>
          <label className={labelCls}>Главное фото</label>
          <div className="flex gap-3 items-center">
            {data.image_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={data.image_url} alt="" className="h-20 w-20 rounded-lg object-cover border" />
            ) : (
              <div className="h-20 w-20 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-300 text-xs">Нет</div>
            )}
            <div className="space-y-2">
              <input value={data.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="URL или загрузите" className={inputCls} />
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadImage(e.target.files[0]); }} />
              <button
                onClick={() => fileRef.current?.click()}
                type="button"
                disabled={uploading}
                className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {uploading ? "Загрузка…" : "Загрузить фото"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Вкус */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900">Крепость и вкус</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Крепость (0–10)</label>
            <input
              type="number" min={0} max={10}
              value={data.strength_scale}
              onChange={(e) => set("strength_scale", e.target.value === "" ? "" : Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Баланс сладости (0 сладко – 10 сухо)</label>
            <input
              type="number" min={0} max={10}
              value={data.taste_sweet_dry_scale}
              onChange={(e) => set("taste_sweet_dry_scale", e.target.value === "" ? "" : Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* Доп. инфо */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900">Дополнительно</h2>
        <div>
          <label className={labelCls}>История</label>
          <textarea value={data.history} onChange={(e) => set("history", e.target.value)} rows={3} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Аллергены</label>
          <textarea value={data.allergens} onChange={(e) => set("allergens", e.target.value)} rows={2} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Питание</label>
          <textarea value={data.nutrition_note} onChange={(e) => set("nutrition_note", e.target.value)} rows={2} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Алкоголь (примечание)</label>
          <textarea value={data.alcohol_content_note} onChange={(e) => set("alcohol_content_note", e.target.value)} rows={2} className={inputCls} />
        </div>
      </section>

      {/* Автор */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900">Автор и бар</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Автор</label>
            <input value={data.author} onChange={(e) => set("author", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Бар</label>
            <input value={data.bar_name} onChange={(e) => set("bar_name", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Город</label>
            <input value={data.bar_city} onChange={(e) => set("bar_city", e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Описание бара</label>
          <textarea value={data.bar_description} onChange={(e) => set("bar_description", e.target.value)} rows={2} className={inputCls} />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700">Социальные ссылки</p>
          {["telegram", "youtube", "dzen"].map((key) => (
            <div key={key} className="flex gap-2 items-center">
              <span className="text-sm text-zinc-500 w-20 capitalize">{key}</span>
              <input
                value={data.social_links[key] || ""}
                onChange={(e) => setSocialLink(key, e.target.value)}
                placeholder={`https://...`}
                className={`${inputCls} flex-1`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Теги */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900">Теги</h2>
        <div className="flex flex-wrap gap-2">
          {data.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 text-zinc-700 text-sm">
              {tag}
              <button onClick={() => set("tags", data.tags.filter((t) => t !== tag))} type="button" className="text-zinc-400 hover:text-red-500">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="Новый тег"
            className={`${inputCls} max-w-xs`}
          />
          <button onClick={addTag} type="button" className="text-sm text-primary-600 hover:underline">Добавить</button>
        </div>
      </section>

      {/* Действия */}
      <div className="flex items-center justify-between">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 text-white px-6 py-2.5 font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "edit" ? "Сохранить" : "Создать"}
        </button>
        {mode === "edit" && (
          <button
            onClick={handleDelete}
            disabled={saving}
            className="text-sm text-red-600 hover:underline disabled:opacity-50"
          >
            Удалить коктейль
          </button>
        )}
      </div>
    </div>
  );
}
