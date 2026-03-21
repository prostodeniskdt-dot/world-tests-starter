import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import Link from "next/link";
import { Coffee, ArrowLeft, BookOpen, ClipboardCheck, Martini } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { formatCategorySpecificForDisplay } from "@/lib/naDisplayHelpers";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { rows } = await db.query(
      "SELECT name, description, image_url FROM na_products WHERE slug = $1 AND is_published = true",
      [slug]
    );
    if (rows.length === 0) return { title: `Б/А | ${SITE_NAME}` };
    const item = rows[0] as Row;
    const title = `${String(item.name)} | Б/А | ${SITE_NAME}`;
    const desc = item.description ? String(item.description).slice(0, 160) : undefined;
    const img = item.image_url ? String(item.image_url) : undefined;
    return {
      title,
      description: desc,
      openGraph: img ? { images: [{ url: img }] } : undefined,
    };
  } catch {
    return { title: `Б/А | ${SITE_NAME}` };
  }
}

export default async function NAProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { rows } = await db.query(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
     FROM na_products p
     LEFT JOIN na_categories c ON c.id = p.category_id
     WHERE p.slug = $1 AND p.is_published = true`,
    [slug]
  );

  if (rows.length === 0) notFound();
  const item = rows[0] as Row;
  const productId = item.id as number;
  const categorySlug = item.category_slug != null ? String(item.category_slug) : "";
  const categoryName =
    item.category_name != null ? String(item.category_name) : "Категория";
  const flavorProfile = item.flavor_profile as Record<string, number> | null;
  const tags = (Array.isArray(item.tags) ? item.tags : []) as string[];
  const categorySpecific = item.category_specific;
  const categoryExtra = item.category_extra as Record<string, unknown> | null;

  const specificLines = formatCategorySpecificForDisplay(categorySlug, categorySpecific);

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
         WHERE elem->>'na_product_slug' = $1
       )
       ORDER BY c.name ASC
       LIMIT 24`,
      [slug]
    );
    withCocktails = cr.rows as CocktailRow[];
  } catch {
    withCocktails = [];
  }

  type SubRow = { id: number; name: string; slug: string; image_url: string | null };
  let substitutes: SubRow[] = [];
  try {
    const sr = await db.query(
      `SELECT p.id, p.name, p.slug, p.image_url
       FROM na_product_substitutes s
       JOIN na_products p ON p.id = (CASE WHEN s.product_id = $1 THEN s.substitute_id ELSE s.product_id END)
       WHERE (s.product_id = $1 OR s.substitute_id = $1) AND p.is_published = true
       ORDER BY p.name ASC`,
      [productId]
    );
    substitutes = sr.rows as SubRow[];
  } catch {
    substitutes = [];
  }

  const hasFlavorBars = flavorProfile && Object.keys(flavorProfile).length > 0;
  const nav: { id: string; label: string }[] = [{ id: "summary", label: "О продукте" }];
  if (specificLines.length > 0 || (categoryExtra && Object.keys(categoryExtra).length > 0)) {
    nav.push({ id: "specific", label: "Характеристики" });
  }
  if (hasFlavorBars) nav.push({ id: "taste", label: "Профиль (оценка)" });
  if (articleLink || practiceTest) nav.push({ id: "learn", label: "Учёба" });
  if (withCocktails.length > 0) nav.push({ id: "cocktails", label: "В коктейлях" });
  if (substitutes.length > 0) nav.push({ id: "subs", label: "Аналоги" });

  const amountLine =
    item.amount_numeric != null && item.amount_numeric !== ""
      ? `${item.amount_numeric} ${item.amount_unit != null ? String(item.amount_unit) : ""}`.trim()
      : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/na"
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Б/А
      </Link>

      <div
        className={
          nav.length > 1
            ? "lg:grid lg:grid-cols-[10.5rem_1fr] lg:gap-8 items-start"
            : ""
        }
      >
        {nav.length > 1 && (
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
        )}

        <article className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-soft min-w-0">
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
                <Coffee className="h-24 w-24 text-zinc-300" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-zinc-900">{String(item.name)}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">{categoryName}</span>
              </div>
              {item.subcategory_text ? (
                <p className="text-sm text-zinc-600 mb-2">{String(item.subcategory_text)}</p>
              ) : null}
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {tags.map((t) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-primary-50 text-primary-800">
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
              {item.producer ? (
                <p className="text-sm text-zinc-700 mb-2">
                  <span className="text-zinc-500">Производитель:</span> {String(item.producer)}
                </p>
              ) : null}
              {item.country ? (
                <p className="text-sm text-zinc-700 mb-2">
                  <span className="text-zinc-500">Страна:</span> {String(item.country)}
                </p>
              ) : null}
              {amountLine ? (
                <p className="text-sm text-zinc-700 mb-3">
                  <span className="text-zinc-500">Объём / вес:</span> {amountLine}
                </p>
              ) : null}

              {item.description ? (
                <div className="prose prose-sm text-zinc-700 max-w-none border-t border-zinc-100 pt-4">
                  <p>{String(item.description)}</p>
                </div>
              ) : null}

              {item.taste_description ? (
                <div className="mt-4">
                  <h2 className="text-sm font-semibold text-zinc-900 mb-1">Вкус (описание)</h2>
                  <p className="text-sm text-zinc-700 whitespace-pre-wrap">{String(item.taste_description)}</p>
                </div>
              ) : null}

              {item.usage_in_drinks ? (
                <div className="mt-4">
                  <h2 className="text-sm font-semibold text-zinc-900 mb-1">Применение в напитках</h2>
                  <p className="text-sm text-zinc-700 whitespace-pre-wrap">{String(item.usage_in_drinks)}</p>
                </div>
              ) : null}

              {item.usage_in_food ? (
                <div className="mt-4">
                  <h2 className="text-sm font-semibold text-zinc-900 mb-1">Применение в еде</h2>
                  <p className="text-sm text-zinc-700 whitespace-pre-wrap">{String(item.usage_in_food)}</p>
                </div>
              ) : null}
            </div>
          </div>

          {(specificLines.length > 0 || (categoryExtra && Object.keys(categoryExtra).length > 0)) && (
            <div id="specific" className="border-t border-zinc-200 p-6 scroll-mt-24">
              <h2 className="font-semibold text-zinc-900 mb-3">Характеристики по категории</h2>
              {specificLines.length > 0 && (
                <dl className="space-y-2 text-sm mb-4">
                  {specificLines.map((line) => (
                    <div key={line.label}>
                      <dt className="text-zinc-500">{line.label}</dt>
                      <dd className="text-zinc-900 font-medium">{line.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {categoryExtra && Object.keys(categoryExtra).length > 0 && (
                <div className="text-sm space-y-2">
                  <p className="font-medium text-zinc-800">Дополнительно</p>
                  {Object.entries(categoryExtra).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-zinc-500">{k}: </span>
                      <span className="text-zinc-800 whitespace-pre-wrap">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(Boolean(item.interesting_facts) || Boolean(item.about_brand)) && (
            <div className="border-t border-zinc-200 p-6 space-y-4">
              {item.interesting_facts ? (
                <div>
                  <h2 className="font-semibold text-zinc-900 mb-1">Это интересно</h2>
                  <p className="text-sm text-zinc-700 whitespace-pre-wrap">{String(item.interesting_facts)}</p>
                </div>
              ) : null}
              {item.about_brand ? (
                <div>
                  <h2 className="font-semibold text-zinc-900 mb-1">О бренде</h2>
                  <p className="text-sm text-zinc-700 whitespace-pre-wrap">{String(item.about_brand)}</p>
                </div>
              ) : null}
            </div>
          )}

          {hasFlavorBars && (
            <div id="taste" className="border-t border-zinc-200 p-6 scroll-mt-24">
              <h2 className="font-semibold text-zinc-900 mb-3">Вкусовой профиль (оценка)</h2>
              <div className="space-y-2 max-w-lg">
                {Object.entries(flavorProfile!).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-sm text-zinc-600 w-32 capitalize">{key}</span>
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
            </div>
          )}

          {(item.composition != null || item.calories != null) && (
            <div className="border-t border-zinc-200 px-6 py-4 text-sm text-zinc-600 space-y-1">
              {item.composition != null ? <p>Состав: {String(item.composition)}</p> : null}
              {item.calories != null ? <p>Калорийность: {String(item.calories)}</p> : null}
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
                Рецепты, где в ингредиентах указан slug этой карточки (поле «Б/А»).
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

          {substitutes.length > 0 && (
            <div id="subs" className="border-t border-zinc-200 p-6 scroll-mt-24">
              <h2 className="font-semibold text-zinc-900 mb-3">Аналоги и замены</h2>
              <ul className="grid sm:grid-cols-2 gap-2">
                {substitutes.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/na/${encodeURIComponent(s.slug)}`}
                      className="flex items-center gap-2 text-sm text-primary-600 hover:underline"
                    >
                      {s.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={s.image_url} alt="" className="w-10 h-10 rounded object-cover bg-zinc-100" />
                      ) : (
                        <Coffee className="w-10 h-10 text-zinc-300" />
                      )}
                      <span className="font-medium text-zinc-900">{s.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
