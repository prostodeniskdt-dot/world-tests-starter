import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  Wine,
  ArrowLeft,
  BookOpen,
  ClipboardCheck,
  Martini,
} from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { parseSensoryForDisplay, sensoryLabelRu } from "@/lib/sensoryMatrix";
import {
  DRINK_TYPE_CONFIG,
  normalizeDrinkType,
  sensoryKeysForDrinkType,
  type DrinkType,
} from "@/lib/alcoholDrinkTypes";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

function orderedSensoryKeys(sensory: Record<string, number>, dt: DrinkType): string[] {
  const preferred = [...sensoryKeysForDrinkType(dt)];
  const valid = Object.entries(sensory)
    .filter(([, v]) => v >= 1 && v <= 5)
    .map(([k]) => k);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of preferred) {
    if (valid.includes(k)) {
      out.push(k);
      seen.add(k);
    }
  }
  for (const k of valid) {
    if (!seen.has(k)) out.push(k);
  }
  return out;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { rows } = await db.query(
      "SELECT name, description, image_url FROM alcohol_products WHERE slug = $1 AND is_published = true",
      [slug]
    );
    if (rows.length === 0) return { title: `Алкоголь | ${SITE_NAME}` };
    const item = rows[0] as Row;
    const title = `${String(item.name)} | Алкоголь | ${SITE_NAME}`;
    const desc = item.description ? String(item.description).slice(0, 160) : undefined;
    const img = item.image_url ? String(item.image_url) : undefined;
    return {
      title,
      description: desc,
      openGraph: img ? { images: [{ url: img }] } : undefined,
    };
  } catch {
    return { title: `Алкоголь | ${SITE_NAME}` };
  }
}

export default async function AlcoholProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { rows } = await db.query(
    "SELECT * FROM alcohol_products WHERE slug = $1 AND is_published = true",
    [slug]
  );

  if (rows.length === 0) notFound();
  const item = rows[0] as Row;
  const flavorProfile = item.flavor_profile as Record<string, number> | null;
  const sensory = parseSensoryForDisplay(item.sensory_matrix);
  const drinkType = normalizeDrinkType(item.drink_type);
  const cfg = DRINK_TYPE_CONFIG[drinkType];

  const primaryIngredient =
    item.primary_ingredient != null && String(item.primary_ingredient).trim() !== ""
      ? String(item.primary_ingredient)
      : item.grape_or_raw_material != null
        ? String(item.grape_or_raw_material)
        : null;

  let articleLink: { slug: string; title: string } | null = null;
  const artId = item.related_knowledge_article_id;
  if (artId != null) {
    try {
      const ar = await db.query(
        `SELECT slug, title FROM knowledge_articles WHERE id = $1 AND is_published = true LIMIT 1`,
        [artId]
      );
      const r = ar.rows[0] as { slug: string; title: string } | undefined;
      if (r) articleLink = { slug: r.slug, title: r.title };
    } catch {
      articleLink = null;
    }
  }

  let practiceTest: { id: string; title: string } | null = null;
  const rawTid = item.practice_test_id != null ? String(item.practice_test_id).trim() : "";
  if (rawTid) {
    try {
      const tr = await db.query(
        `SELECT id, title FROM tests WHERE id = $1 AND is_published = true LIMIT 1`,
        [rawTid]
      );
      const t = tr.rows[0] as { id: string; title: string } | undefined;
      if (t) practiceTest = { id: String(t.id), title: String(t.title) };
    } catch {
      practiceTest = null;
    }
  }

  type CocktailRow = { id: number; name: string; slug: string; image_url: string | null; description: string | null };
  let withCocktails: CocktailRow[] = [];
  try {
    const cr = await db.query(
      `SELECT id, name, slug, image_url, description FROM cocktails c
       WHERE c.is_published = true
       AND EXISTS (
         SELECT 1 FROM jsonb_array_elements(COALESCE(c.ingredients, '[]'::jsonb)) elem
         WHERE elem->>'alcohol_product_slug' = $1
       )
       ORDER BY c.name ASC
       LIMIT 24`,
      [slug]
    );
    withCocktails = cr.rows as CocktailRow[];
  } catch {
    withCocktails = [];
  }

  const sensoryKeysOrdered = orderedSensoryKeys(sensory, drinkType);
  const hasSensoryBars = sensoryKeysOrdered.length > 0;
  const hasServing =
    Boolean(item.serving_temperature) ||
    Boolean(item.recommended_glassware) ||
    Boolean(item.serve_style);

  const nav: { id: string; label: string }[] = [];
  nav.push({ id: "summary", label: "О продукте" });
  if (hasServing) nav.push({ id: "serving", label: "Подача" });
  if (hasSensoryBars || (flavorProfile && Object.keys(flavorProfile).length > 0)) {
    nav.push({ id: "taste", label: "Вкус" });
  }
  if (articleLink || practiceTest) nav.push({ id: "learn", label: "Учёба" });
  if (withCocktails.length > 0) nav.push({ id: "cocktails", label: "В коктейлях" });
  nav.push({ id: "details", label: "Подробнее" });

  const subtitle = [item.country, item.region].filter(Boolean).map(String).join(", ");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/alcohol"
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Алкоголь
      </Link>

      <div
        className={
          nav.length > 0
            ? "lg:grid lg:grid-cols-[10.5rem_1fr] lg:gap-8 items-start"
            : ""
        }
      >
        <aside className="hidden lg:block sticky top-24 self-start mb-6 lg:mb-0">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Разделы</p>
          <nav className="space-y-1 text-sm">
            {nav.map((n) => (
              <a key={n.id} href={`#${n.id}`} className="block text-primary-600 hover:underline py-0.5">
                {n.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-6">
          <article className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-soft">
            <div id="summary" className="scroll-mt-24 grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              <div className="aspect-square max-h-96 md:max-h-none bg-zinc-100 rounded-lg flex items-center justify-center overflow-hidden">
                {item.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.image_url as string}
                    alt={item.name as string}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Wine className="h-24 w-24 text-zinc-300" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-zinc-900">{String(item.name)}</h1>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                    {cfg.label}
                  </span>
                </div>
                {subtitle ? <p className="text-zinc-600 text-sm mb-4">{subtitle}</p> : null}
                {item.producer ? (
                  <p className="text-sm text-zinc-700 mb-3">
                    <span className="text-zinc-500">Производитель:</span> {String(item.producer)}
                  </p>
                ) : null}

                <dl className="space-y-2 text-sm border-t border-zinc-100 pt-4">
                  {primaryIngredient ? (
                    <>
                      <dt className="text-zinc-500">Основное сырьё</dt>
                      <dd className="text-zinc-900 font-medium">{primaryIngredient}</dd>
                    </>
                  ) : null}
                  {item.additional_ingredients ? (
                    <>
                      <dt className="text-zinc-500">Доп. ингредиенты / ботаникалы</dt>
                      <dd className="text-zinc-900 font-medium whitespace-pre-wrap">
                        {String(item.additional_ingredients)}
                      </dd>
                    </>
                  ) : null}
                  {item.abv != null && item.abv !== "" ? (
                    <>
                      <dt className="text-zinc-500">Крепость</dt>
                      <dd className="text-zinc-900 font-medium">{Number(item.abv)}% ABV</dd>
                    </>
                  ) : null}
                  {item.volume ? (
                    <>
                      <dt className="text-zinc-500">Объём</dt>
                      <dd className="text-zinc-900 font-medium">{String(item.volume)}</dd>
                    </>
                  ) : null}
                </dl>

                {item.description ? (
                  <div className="prose prose-sm text-zinc-700 max-w-none mt-4">
                    <p>{String(item.description)}</p>
                  </div>
                ) : null}
              </div>
            </div>

            {hasServing && (
              <div id="serving" className="border-t border-zinc-200 p-6 scroll-mt-24">
                <h2 className="font-semibold text-zinc-900 mb-3">Подача</h2>
                <dl className="space-y-2 text-sm">
                  {item.serving_temperature ? (
                    <>
                      <dt className="text-zinc-500">Температура</dt>
                      <dd className="text-zinc-900">{String(item.serving_temperature)}</dd>
                    </>
                  ) : null}
                  {item.recommended_glassware ? (
                    <>
                      <dt className="text-zinc-500">Посуда</dt>
                      <dd className="text-zinc-900">{String(item.recommended_glassware)}</dd>
                    </>
                  ) : null}
                  {item.serve_style ? (
                    <>
                      <dt className="text-zinc-500">Способ</dt>
                      <dd className="text-zinc-900">{String(item.serve_style)}</dd>
                    </>
                  ) : null}
                </dl>
              </div>
            )}

            {(hasSensoryBars || (flavorProfile && Object.keys(flavorProfile).length > 0)) && (
              <div id="taste" className="border-t border-zinc-200 p-6 scroll-mt-24">
                <h2 className="font-semibold text-zinc-900 mb-4">Вкус и сенсорика</h2>
                {hasSensoryBars && (
                  <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-4 mb-4 space-y-3 max-w-lg">
                    {sensoryKeysOrdered.map((key) => {
                      const v = sensory[key];
                      if (v == null) return null;
                      const n = Math.min(5, Math.max(1, Math.round(Number(v))));
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-zinc-700">{sensoryLabelRu(key)}</span>
                            <span className="text-zinc-500">{n}/5</span>
                          </div>
                          <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-600 rounded-full"
                              style={{ width: `${(n / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {flavorProfile && Object.keys(flavorProfile).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-zinc-800">Доп. профиль</p>
                    {Object.entries(flavorProfile).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-sm text-zinc-600 w-28 capitalize">{key}</span>
                        <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full"
                            style={{
                              width: `${Math.min(100, Math.max(0, Number(val) || 0))}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-zinc-500 w-8">{Number(val) || 0}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(Boolean(item.wine_or_spirit_style) ||
              Boolean(item.tasting_notes) ||
              Boolean(item.gastronomy) ||
              Boolean(item.vineyards_or_origin_detail)) && (
              <div className="border-t border-zinc-200 p-6 space-y-5">
                {item.wine_or_spirit_style ? (
                  <div>
                    <h2 className="font-semibold text-zinc-900 mb-2">Стилистика</h2>
                    <p className="text-zinc-700 text-sm whitespace-pre-wrap">
                      {String(item.wine_or_spirit_style)}
                    </p>
                  </div>
                ) : null}
                {item.tasting_notes ? (
                  <div>
                    <h2 className="font-semibold text-zinc-900 mb-2">Дегустационные заметки</h2>
                    <p className="text-zinc-700 text-sm whitespace-pre-wrap">
                      {String(item.tasting_notes)}
                    </p>
                  </div>
                ) : null}
                {item.gastronomy ? (
                  <div>
                    <h2 className="font-semibold text-zinc-900 mb-2">Гастрономия</h2>
                    <p className="text-zinc-700 text-sm whitespace-pre-wrap">{String(item.gastronomy)}</p>
                  </div>
                ) : null}
                {item.vineyards_or_origin_detail ? (
                  <div>
                    <h2 className="font-semibold text-zinc-900 mb-2">Терруар и происхождение сырья</h2>
                    <p className="text-zinc-700 text-sm whitespace-pre-wrap">
                      {String(item.vineyards_or_origin_detail)}
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {(articleLink || practiceTest) && (
              <div id="learn" className="border-t border-zinc-200 p-6 scroll-mt-24">
                <h2 className="font-semibold text-zinc-900 mb-3">Углубиться</h2>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                  {articleLink ? (
                    <Link
                      href={`/knowledge/${encodeURIComponent(articleLink.slug)}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-800 hover:bg-primary-100"
                    >
                      <BookOpen className="h-4 w-4 shrink-0" />
                      Статья: {articleLink.title}
                    </Link>
                  ) : null}
                  {practiceTest ? (
                    <Link
                      href={`/test?testId=${encodeURIComponent(practiceTest.id)}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
                    >
                      <ClipboardCheck className="h-4 w-4 shrink-0" />
                      Тест: {practiceTest.title}
                    </Link>
                  ) : null}
                </div>
              </div>
            )}

            {withCocktails.length > 0 && (
              <div id="cocktails" className="border-t border-zinc-200 p-6 scroll-mt-24">
                <h2 className="font-semibold text-zinc-900 mb-3">В коктейлях</h2>
                <p className="text-sm text-zinc-500 mb-4">
                  Рецепты, где в ингредиентах указана эта карточка (поле slug продукта).
                </p>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {withCocktails.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/cocktails/${c.slug}`}
                        className="flex gap-3 rounded-lg border border-zinc-100 p-2 hover:border-primary-200 hover:bg-primary-50/20"
                      >
                        <div className="w-14 h-14 shrink-0 bg-zinc-100 rounded overflow-hidden">
                          {c.image_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={c.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Martini className="h-6 w-6 text-zinc-300" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-900 truncate">{c.name}</p>
                          {c.description ? (
                            <p className="text-xs text-zinc-500 line-clamp-2">{c.description}</p>
                          ) : null}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <details id="details" className="border-t border-zinc-200 group scroll-mt-24">
              <summary className="p-6 cursor-pointer font-semibold text-zinc-900 flex items-center justify-between gap-2 marker:content-['']">
                <span>Все характеристики и производство</span>
                <span className="text-primary-600 text-sm font-normal">▼</span>
              </summary>
              <div className="px-6 pb-6 space-y-5 text-sm">
                {item.aging_method ? (
                  <div>
                    <h3 className="font-semibold text-zinc-900 mb-1">{cfg.maturationTitle}</h3>
                    <p className="text-zinc-700 whitespace-pre-wrap">{String(item.aging_method)}</p>
                  </div>
                ) : null}
                {item.production_method ? (
                  <div>
                    <h3 className="font-semibold text-zinc-900 mb-1">{cfg.productionTitle}</h3>
                    <p className="text-zinc-700 whitespace-pre-wrap">{String(item.production_method)}</p>
                  </div>
                ) : null}
                {item.interesting_facts ? (
                  <div>
                    <h3 className="font-semibold text-zinc-900 mb-1">Это интересно</h3>
                    <p className="text-zinc-700 whitespace-pre-wrap">{String(item.interesting_facts)}</p>
                  </div>
                ) : null}
                {item.about_brand ? (
                  <div>
                    <h3 className="font-semibold text-zinc-900 mb-1">О бренде</h3>
                    <p className="text-zinc-700 whitespace-pre-wrap">{String(item.about_brand)}</p>
                  </div>
                ) : null}
                {item.history ? (
                  <div>
                    <h3 className="font-semibold text-zinc-900 mb-1">История</h3>
                    <p className="text-zinc-700 whitespace-pre-wrap">{String(item.history)}</p>
                  </div>
                ) : null}
                {item.food_usage ? (
                  <div>
                    <h3 className="font-semibold text-zinc-900 mb-1">В кухне и блюдах</h3>
                    <p className="text-zinc-700 whitespace-pre-wrap">{String(item.food_usage)}</p>
                  </div>
                ) : null}
              </div>
            </details>
          </article>
        </div>
      </div>
    </div>
  );
}
