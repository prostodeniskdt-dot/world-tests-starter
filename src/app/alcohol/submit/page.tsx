"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Wine, ImagePlus } from "lucide-react";
import { useLocalUser } from "@/components/UserGate";
import { LoginModal } from "@/components/LoginModal";
import { slugify } from "@/lib/slugify";

type Category = { id: number; name: string; slug: string };
type ArticleOpt = { id: number; title: string; slug: string };
type TestOpt = { id: string; title: string };

export default function AlcoholSubmitPage() {
  const { user } = useLocalUser();
  const [showAuth, setShowAuth] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<ArticleOpt[]>([]);
  const [tests, setTests] = useState<TestOpt[]>([]);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [history, setHistory] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [producer, setProducer] = useState("");
  const [abv, setAbv] = useState("");
  const [volume, setVolume] = useState("");
  const [grapeOrRaw, setGrapeOrRaw] = useState("");
  const [servingTemp, setServingTemp] = useState("");
  const [sweetness, setSweetness] = useState("");
  const [acidity, setAcidity] = useState("");
  const [aromaticity, setAromaticity] = useState("");
  const [body, setBody] = useState("");
  const [gastronomy, setGastronomy] = useState("");
  const [wineStyle, setWineStyle] = useState("");
  const [tastingNotes, setTastingNotes] = useState("");
  const [vineyards, setVineyards] = useState("");
  const [agingMethod, setAgingMethod] = useState("");
  const [productionMethod, setProductionMethod] = useState("");
  const [interestingFacts, setInterestingFacts] = useState("");
  const [aboutBrand, setAboutBrand] = useState("");
  const [foodUsage, setFoodUsage] = useState("");
  const [practiceTestId, setPracticeTestId] = useState("");
  const [relatedArticleId, setRelatedArticleId] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoRights, setPhotoRights] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/alcohol/categories", { credentials: "same-origin" })
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

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/alcohol/upload-image", {
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

  const sensoryPayload = () => {
    const o: Record<string, number> = {};
    const add = (k: string, s: string) => {
      if (s.trim() === "") return;
      const n = parseInt(s, 10);
      if (n >= 1 && n <= 5) o[k] = n;
    };
    add("sweetness", sweetness);
    add("acidity", acidity);
    add("aromaticity", aromaticity);
    add("body", body);
    return o;
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

    const body = {
      name: name.trim(),
      slug: (slug.trim() || slugify(name.trim()) || "").trim(),
      category_id: categoryId === "" ? null : categoryId,
      description: description.trim() || null,
      history: history.trim() || null,
      country: country.trim() || null,
      region: region.trim() || null,
      producer: producer.trim() || null,
      abv: abv.trim() === "" ? null : abv.trim(),
      volume: volume.trim() || null,
      grape_or_raw_material: grapeOrRaw.trim() || null,
      serving_temperature: servingTemp.trim() || null,
      sensory_matrix: sensoryPayload(),
      gastronomy: gastronomy.trim() || null,
      wine_or_spirit_style: wineStyle.trim() || null,
      tasting_notes: tastingNotes.trim() || null,
      vineyards_or_origin_detail: vineyards.trim() || null,
      aging_method: agingMethod.trim() || null,
      production_method: productionMethod.trim() || null,
      interesting_facts: interestingFacts.trim() || null,
      about_brand: aboutBrand.trim() || null,
      food_usage: foodUsage.trim() || null,
      practice_test_id: practiceTestId.trim() || null,
      related_knowledge_article_id:
        relatedArticleId.trim() === ""
          ? null
          : (() => {
              const n = parseInt(relatedArticleId, 10);
              return Number.isNaN(n) ? null : n;
            })(),
      image_url: imageUrl,
      photo_rights_confirmed: true,
    };

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/alcohol/submit", {
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

  const fieldClass = "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm";
  const labelClass = "block text-sm font-medium text-zinc-700 mb-1";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {showAuth && (
        <LoginModal isOpen={showAuth} onClose={() => setShowAuth(false)} initialMode="login" />
      )}
      <Link
        href="/alcohol"
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Алкоголь
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <Wine className="h-8 w-8 text-primary-600" aria-hidden />
        <h1 className="text-2xl font-bold text-zinc-900">Предложить карточку</h1>
      </div>
      <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
        Карточка появится в каталоге после проверки администратором. Укажите достоверные данные; при
        необходимости модератор скорректирует категорию или привязки к статье и тесту.
      </p>

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
          <p className="font-medium">Заявка отправлена</p>
          <p className="text-sm mt-2">После одобрения позиция появится в разделе «Алкоголь».</p>
          <Link href="/alcohol" className="inline-block mt-4 text-sm text-primary-700 font-medium hover:underline">
            Вернуться в каталог
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {!user && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <button
                type="button"
                onClick={() => setShowAuth(true)}
                className="font-semibold text-amber-900 hover:underline"
              >
                Войдите
              </button>
              , чтобы отправить карточку.
            </div>
          )}

          <section className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-900 border-b border-zinc-200 pb-2">
              Основное
            </h2>
            <div>
              <label className={labelClass}>Название *</label>
              <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Slug URL (необязательно)</label>
              <input
                className={fieldClass}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="из названия"
              />
            </div>
            {categories.length > 0 && (
              <div>
                <label className={labelClass}>Категория</label>
                <select
                  className={fieldClass}
                  value={categoryId === "" ? "" : String(categoryId)}
                  onChange={(e) =>
                    setCategoryId(e.target.value === "" ? "" : parseInt(e.target.value, 10))
                  }
                >
                  <option value="">—</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className={labelClass}>Краткое описание</label>
              <textarea className={fieldClass} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-900 border-b border-zinc-200 pb-2">
              Происхождение и продукт
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Страна</label>
                <input className={fieldClass} value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Регион</label>
                <input className={fieldClass} value={region} onChange={(e) => setRegion(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Производитель</label>
                <input className={fieldClass} value={producer} onChange={(e) => setProducer(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Крепость % (ABV)</label>
                <input className={fieldClass} type="text" inputMode="decimal" value={abv} onChange={(e) => setAbv(e.target.value)} placeholder="40 или 0.5" />
              </div>
              <div>
                <label className={labelClass}>Объём</label>
                <input className={fieldClass} value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="0.75 л" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Виноград / сырьё</label>
                <input className={fieldClass} value={grapeOrRaw} onChange={(e) => setGrapeOrRaw(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Температура подачи</label>
                <input className={fieldClass} value={servingTemp} onChange={(e) => setServingTemp(e.target.value)} placeholder="6–8 °C" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-900 border-b border-zinc-200 pb-2">
              Сенсорика (1–5, необязательно)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-zinc-600">Сладость</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  className={fieldClass}
                  value={sweetness}
                  onChange={(e) => setSweetness(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-600">Кислотность</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  className={fieldClass}
                  value={acidity}
                  onChange={(e) => setAcidity(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-600">Ароматичность</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  className={fieldClass}
                  value={aromaticity}
                  onChange={(e) => setAromaticity(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-600">Тело</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  className={fieldClass}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-900 border-b border-zinc-200 pb-2">
              Описание и гастрономия
            </h2>
            <div>
              <label className={labelClass}>Стилистика</label>
              <textarea className={fieldClass} rows={2} value={wineStyle} onChange={(e) => setWineStyle(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Дегустационные заметки</label>
              <textarea className={fieldClass} rows={4} value={tastingNotes} onChange={(e) => setTastingNotes(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Гастрономия</label>
              <textarea className={fieldClass} rows={3} value={gastronomy} onChange={(e) => setGastronomy(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Виноградники / терруар</label>
              <textarea className={fieldClass} rows={3} value={vineyards} onChange={(e) => setVineyards(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>История</label>
              <textarea className={fieldClass} rows={3} value={history} onChange={(e) => setHistory(e.target.value)} />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-900 border-b border-zinc-200 pb-2">
              Производство и бренд
            </h2>
            <div>
              <label className={labelClass}>Способ выдержки</label>
              <textarea className={fieldClass} rows={2} value={agingMethod} onChange={(e) => setAgingMethod(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Способ производства</label>
              <textarea className={fieldClass} rows={3} value={productionMethod} onChange={(e) => setProductionMethod(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Это интересно</label>
              <textarea className={fieldClass} rows={3} value={interestingFacts} onChange={(e) => setInterestingFacts(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>О бренде</label>
              <textarea className={fieldClass} rows={4} value={aboutBrand} onChange={(e) => setAboutBrand(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>В кухне и блюдах</label>
              <textarea className={fieldClass} rows={2} value={foodUsage} onChange={(e) => setFoodUsage(e.target.value)} />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-900 border-b border-zinc-200 pb-2">
              Обучение (необязательно)
            </h2>
            <div>
              <label className={labelClass}>Статья в базе знаний</label>
              <select
                className={fieldClass}
                value={relatedArticleId}
                onChange={(e) => setRelatedArticleId(e.target.value)}
              >
                <option value="">—</option>
                {articles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Тест для закрепления</label>
              <select
                className={fieldClass}
                value={practiceTestId}
                onChange={(e) => setPracticeTestId(e.target.value)}
              >
                <option value="">—</option>
                {tests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 p-4 space-y-3">
            <p className="text-sm font-medium text-zinc-800">Фото продукта</p>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 cursor-pointer hover:bg-zinc-50 text-sm">
              <ImagePlus className="h-4 w-4" />
              Загрузить
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading || !user}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadFile(f);
                  e.target.value = "";
                }}
              />
            </label>
            {uploading && <span className="text-xs text-zinc-500">Загрузка…</span>}
            {imageUrl && (
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="h-28 w-28 object-cover rounded-lg border" />
                <button type="button" onClick={() => setImageUrl(null)} className="text-sm text-red-600 hover:underline">
                  Убрать
                </button>
              </div>
            )}
          </section>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={photoRights}
              onChange={(e) => setPhotoRights(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm text-zinc-700">
              Подтверждаю права на фото (свои снимки или разрешение на публикацию).
            </span>
          </label>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !user}
            className="px-6 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? "Отправка…" : "Отправить на модерацию"}
          </button>
        </form>
      )}
    </div>
  );
}
