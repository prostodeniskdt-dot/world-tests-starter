"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Martini, ImagePlus } from "lucide-react";
import { useLocalUser } from "@/components/UserGate";
import { LoginModal } from "@/components/LoginModal";
import { slugify } from "@/lib/slugify";

type IngredientRow = { name: string; amount: string; alcohol_product_slug: string };

export default function CocktailSubmitPage() {
  const { user } = useLocalUser();
  const [showAuth, setShowAuth] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [method, setMethod] = useState("");
  const [glass, setGlass] = useState("");
  const [garnish, setGarnish] = useState("");
  const [ice, setIce] = useState("");
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { name: "", amount: "", alcohol_product_slug: "" },
  ]);
  const [instructions, setInstructions] = useState("");
  const [cordialsRecipe, setCordialsRecipe] = useState("");
  const [barName, setBarName] = useState("");
  const [barCity, setBarCity] = useState("");
  const [barDescription, setBarDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [history, setHistory] = useState("");
  const [allergens, setAllergens] = useState("");
  const [strengthScale, setStrengthScale] = useState("");
  const [tasteScale, setTasteScale] = useState("");
  const [nutritionNote, setNutritionNote] = useState("");
  const [alcoholContentNote, setAlcoholContentNote] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photoRights, setPhotoRights] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const uploadFile = async (file: File, asGallery: boolean) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/cocktails/upload-image", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.ok && data.url) {
        if (asGallery) {
          setGalleryUrls((prev) => [...prev, data.url].slice(0, 12));
        } else {
          setImageUrl(data.url);
        }
      } else {
        setError(data.error || "Не удалось загрузить изображение");
      }
    } catch {
      setError("Ошибка сети при загрузке");
    } finally {
      setUploading(false);
    }
  };

  const addIngredient = () => {
    setIngredients((prev) => [...prev, { name: "", amount: "", alcohol_product_slug: "" }]);
  };

  const setIngredient = (i: number, field: keyof IngredientRow, value: string) => {
    setIngredients((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const removeIngredient = (i: number) => {
    setIngredients((prev) => prev.filter((_, j) => j !== i));
  };

  const parseScaleField = (s: string): number | null => {
    if (s.trim() === "") return null;
    const n = parseInt(s, 10);
    if (Number.isNaN(n) || n < 0 || n > 10) return null;
    return n;
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

    const cleaned = ingredients
      .filter((r) => r.name.trim() || r.amount.trim())
      .map((r) => {
        const slug = r.alcohol_product_slug.trim();
        return {
          name: r.name.trim(),
          amount: r.amount.trim(),
          ...(slug ? { alcohol_product_slug: slug } : {}),
        };
      });
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const body = {
      name: name.trim(),
      slug: (slug.trim() || slugify(name.trim()) || "").trim(),
      description: description.trim() || null,
      method: method.trim() || null,
      glass: glass.trim() || null,
      garnish: garnish.trim() || null,
      ice: ice.trim() || null,
      ingredients: cleaned,
      instructions: instructions.trim() || null,
      cordials_recipe: cordialsRecipe.trim() || null,
      bar_name: barName.trim() || null,
      bar_city: barCity.trim() || null,
      bar_description: barDescription.trim() || null,
      author: author.trim() || null,
      history: history.trim() || null,
      allergens: allergens.trim() || null,
      strength_scale: parseScaleField(strengthScale),
      taste_sweet_dry_scale: parseScaleField(tasteScale),
      nutrition_note: nutritionNote.trim() || null,
      alcohol_content_note: alcoholContentNote.trim() || null,
      tags,
      image_url: imageUrl,
      gallery_urls: galleryUrls,
      photo_rights_confirmed: true,
    };

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/cocktails/submit", {
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
      setName("");
      setSlug("");
      setDescription("");
      setMethod("");
      setGlass("");
      setGarnish("");
      setIce("");
      setIngredients([{ name: "", amount: "", alcohol_product_slug: "" }]);
      setInstructions("");
      setCordialsRecipe("");
      setBarName("");
      setBarCity("");
      setBarDescription("");
      setAuthor("");
      setHistory("");
      setAllergens("");
      setStrengthScale("");
      setTasteScale("");
      setNutritionNote("");
      setAlcoholContentNote("");
      setTagsInput("");
      setImageUrl(null);
      setGalleryUrls([]);
      setPhotoRights(false);
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
        Рецепт появится в каталоге после проверки администратором. Отнести коктейль к{" "}
        <strong>классике</strong> или <strong>авторским</strong> решает модератор. Для авторских
        рецептов укажите автора и бар — так удобнее посетителям.
      </p>

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
          <p className="font-medium">Заявка отправлена</p>
          <p className="text-sm mt-2">
            После одобрения коктейль появится в разделе «Коктейли». Спасибо за вклад!
          </p>
          <Link href="/cocktails" className="inline-block mt-4 text-sm text-primary-700 font-medium hover:underline">
            Вернуться в каталог
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {!user && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
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

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Название *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Slug URL (необязательно)</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="авто из названия"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono"
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
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Метод</label>
              <input
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                placeholder="шейк, стир, билд…"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Бокал</label>
              <input
                value={glass}
                onChange={(e) => setGlass(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Гарнир</label>
              <input
                value={garnish}
                onChange={(e) => setGarnish(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Лёд</label>
              <input
                value={ice}
                onChange={(e) => setIce(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-zinc-700">Ингредиенты</label>
              <button
                type="button"
                onClick={addIngredient}
                className="text-sm text-primary-600 hover:underline"
              >
                + строка
              </button>
            </div>
            <p className="text-xs text-zinc-500 mb-2">
              Опционально: slug карточки из раздела «Алкоголь» — тогда напиток появится в блоке «В коктейлях» на
              карточке продукта.
            </p>
            <div className="space-y-3">
              {ingredients.map((row, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-lg border border-zinc-100 p-2 bg-zinc-50/50">
                  <div className="flex flex-wrap gap-2">
                    <input
                      value={row.amount}
                      onChange={(e) => setIngredient(i, "amount", e.target.value)}
                      placeholder="объём"
                      className="w-28 shrink-0 rounded-lg border border-zinc-300 px-2 py-2 text-sm bg-white"
                    />
                    <input
                      value={row.name}
                      onChange={(e) => setIngredient(i, "name", e.target.value)}
                      placeholder="ингредиент"
                      className="flex-1 min-w-[120px] rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white"
                    />
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredient(i)}
                        className="text-zinc-400 hover:text-red-600 px-2 self-center"
                        aria-label="Удалить строку"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <input
                    value={row.alcohol_product_slug}
                    onChange={(e) => setIngredient(i, "alcohol_product_slug", e.target.value)}
                    placeholder="slug карточки алкоголя (необязательно)"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs font-mono bg-white"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Приготовление</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Доп. рецепты (кордиалы и т.д.)
            </label>
            <textarea
              value={cordialsRecipe}
              onChange={(e) => setCordialsRecipe(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="border-t border-zinc-200 pt-6">
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">Авторский рецепт (по желанию)</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-600 mb-1">Автор</label>
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-600 mb-1">Бар</label>
                <input
                  value={barName}
                  onChange={(e) => setBarName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-600 mb-1">Город</label>
                <input
                  value={barCity}
                  onChange={(e) => setBarCity(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm text-zinc-600 mb-1">О баре</label>
              <textarea
                value={barDescription}
                onChange={(e) => setBarDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">История напитка</label>
            <textarea
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Аллергены</label>
            <textarea
              value={allergens}
              onChange={(e) => setAllergens(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Крепость (0–10, необязательно)
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={strengthScale}
                onChange={(e) => setStrengthScale(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Сладость — сухость/кислота (0–10)
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={tasteScale}
                onChange={(e) => setTasteScale(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Питание (кратко)</label>
            <textarea
              value={nutritionNote}
              onChange={(e) => setNutritionNote(e.target.value)}
              rows={2}
              placeholder="ккал на порцию и т.д."
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Содержание алкоголя (кратко)
            </label>
            <textarea
              value={alcoholContentNote}
              onChange={(e) => setAlcoholContentNote(e.target.value)}
              rows={2}
              placeholder="% об., стандартные порции…"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Теги через запятую</label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="rounded-lg border border-zinc-200 p-4 space-y-4">
            <p className="text-sm font-medium text-zinc-800">Фото</p>
            <p className="text-xs text-zinc-500">
              Загружайте только изображения, на которые у вас есть права. Фото проверяется при
              модерации.
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 cursor-pointer hover:bg-zinc-50 text-sm">
                <ImagePlus className="h-4 w-4" />
                Главное фото
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploading || !user}
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
                  disabled={uploading || !user}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadFile(f, true);
                    e.target.value = "";
                  }}
                />
              </label>
              {uploading && <span className="text-xs text-zinc-500">Загрузка…</span>}
            </div>
            {imageUrl && (
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="h-24 w-24 object-cover rounded-lg border" />
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Убрать главное
                </button>
              </div>
            )}
            {galleryUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {galleryUrls.map((u, idx) => (
                  <div key={u} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" className="h-16 w-16 object-cover rounded border" />
                    <button
                      type="button"
                      onClick={() => setGalleryUrls((p) => p.filter((_, j) => j !== idx))}
                      className="absolute -top-2 -right-2 bg-white border rounded-full w-5 h-5 text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={photoRights}
              onChange={(e) => setPhotoRights(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm text-zinc-700">
              Подтверждаю: использую только фото без нарушения авторских прав или даю полное разрешение
              на публикацию своих снимков на сайте.
            </span>
          </label>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !user}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? "Отправка…" : "Отправить на модерацию"}
          </button>
        </form>
      )}
    </div>
  );
}
