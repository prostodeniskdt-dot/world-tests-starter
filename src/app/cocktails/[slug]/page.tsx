import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import Link from "next/link";
import { Martini, ArrowLeft, Send, Youtube } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

type Row = Record<string, unknown>;

function parseGallery(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((u) => typeof u === "string" && u.trim()).map(String);
  }
  return [];
}

function ScaleBar({
  value,
  leftLabel,
  rightLabel,
  title,
}: {
  value: number;
  leftLabel: string;
  rightLabel: string;
  title: string;
}) {
  const v = Math.min(10, Math.max(0, value));
  const pct = v * 10;
  return (
    <div className="mb-4">
      <p className="text-sm font-medium text-zinc-900 mb-2">{title}</p>
      <div className="flex justify-between text-xs text-zinc-500 mb-1">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <div className="relative h-3 bg-zinc-200 rounded-full overflow-visible">
        <div
          className="absolute top-1/2 h-4 w-4 -mt-2 rounded-full bg-primary-600 border-2 border-white shadow"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
      <p className="text-xs text-zinc-600 mt-1.5">
        Значение: {v} из 10 (среднее при 5)
      </p>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { rows } = await db.query(
      "SELECT name, description, image_url FROM cocktails WHERE slug = $1 AND is_published = true",
      [slug]
    );
    if (rows.length === 0) return { title: `Коктейль | ${SITE_NAME}` };
    const item = rows[0] as Row;
    const title = `${String(item.name)} | Коктейли | ${SITE_NAME}`;
    const desc = item.description ? String(item.description).slice(0, 160) : undefined;
    const img = item.image_url ? String(item.image_url) : undefined;
    return {
      title,
      description: desc,
      openGraph: img ? { images: [{ url: img }] } : undefined,
    };
  } catch {
    return { title: `Коктейль | ${SITE_NAME}` };
  }
}

export default async function CocktailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { rows } = await db.query(
    "SELECT * FROM cocktails WHERE slug = $1 AND is_published = true",
    [slug]
  );

  if (rows.length === 0) notFound();
  const item = rows[0] as Row;
  const ingredients = item.ingredients as
    | {
        name: string;
        amount: string;
        alcohol_product_slug?: string;
        na_product_slug?: string;
      }[]
    | null;
  const flavorProfile = item.flavor_profile as Record<string, number> | null;
  const tags = item.tags as string[] | null;
  const gallery = parseGallery(item.gallery_urls);

  const strength =
    item.strength_scale != null && item.strength_scale !== ""
      ? Number(item.strength_scale)
      : null;
  const tasteDry =
    item.taste_sweet_dry_scale != null && item.taste_sweet_dry_scale !== ""
      ? Number(item.taste_sweet_dry_scale)
      : null;

  const navItems: { id: string; label: string }[] = [];
  if (ingredients && ingredients.length > 0) navItems.push({ id: "ingredients", label: "Ингредиенты" });
  if (item.instructions) navItems.push({ id: "howto", label: "Приготовление" });
  if (item.allergens) navItems.push({ id: "allergens", label: "Аллергены" });
  if (strength != null || tasteDry != null || (flavorProfile && Object.keys(flavorProfile).length > 0)) {
    navItems.push({ id: "taste", label: "Крепость и вкус" });
  }
  if (item.image_url || gallery.length > 0) navItems.push({ id: "gallery", label: "Галерея" });
  if (item.history) navItems.push({ id: "history", label: "История" });
  if (item.nutrition_note) navItems.push({ id: "nutrition", label: "Питание" });
  if (item.alcohol_content_note) navItems.push({ id: "alcohol", label: "Алкоголь" });

  let related: { id: number; name: string; slug: string; image_url: string | null; description: string | null }[] =
    [];
  try {
    const rel = await db.query(
      `SELECT id, name, slug, image_url, description FROM cocktails
       WHERE is_published = true AND slug <> $1
       ORDER BY random() LIMIT 4`,
      [slug]
    );
    related = rel.rows as typeof related;
  } catch {
    related = [];
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/cocktails"
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Коктейли
      </Link>

      <div
        className={
          navItems.length > 0
            ? "lg:grid lg:grid-cols-[11rem_1fr_14rem] lg:gap-8 items-start"
            : "lg:grid lg:grid-cols-[1fr_14rem] lg:gap-8 items-start"
        }
      >
        {navItems.length > 0 && (
          <aside className="hidden lg:block sticky top-24 self-start">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              Разделы
            </p>
            <nav className="space-y-1 text-sm">
              {navItems.map((n) => (
                <a
                  key={n.id}
                  href={`#${n.id}`}
                  className="block text-primary-600 hover:underline py-0.5"
                >
                  {n.label}
                </a>
              ))}
            </nav>
          </aside>
        )}

        <article className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-soft min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div id="gallery" className="scroll-mt-24 space-y-3">
              <div className="aspect-square max-h-80 md:max-h-none bg-zinc-100 rounded-lg flex items-center justify-center overflow-hidden">
                {item.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.image_url as string}
                    alt={item.name as string}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Martini className="h-24 w-24 text-zinc-300" />
                )}
              </div>
              {gallery.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {gallery.map((u) => (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={u}
                      src={u}
                      alt=""
                      className="h-16 w-16 object-cover rounded-md border border-zinc-200"
                    />
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-zinc-900">{String(item.name)}</h1>
                {item.is_classic ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                    Классика
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                    Авторский
                  </span>
                )}
              </div>
              {item.method ? (
                <p className="text-sm text-zinc-600 mb-1">Метод: {String(item.method)}</p>
              ) : null}
              {item.glass ? (
                <p className="text-sm text-zinc-600 mb-1">Бокал: {String(item.glass)}</p>
              ) : null}
              {item.garnish ? (
                <p className="text-sm text-zinc-600 mb-4">Гарнир: {String(item.garnish)}</p>
              ) : null}
              {item.description ? (
                <div className="prose prose-sm text-zinc-700 max-w-none">
                  <p>{String(item.description)}</p>
                </div>
              ) : null}
            </div>
          </div>

          {ingredients && ingredients.length > 0 && (
            <div id="ingredients" className="border-t border-zinc-200 p-6 scroll-mt-24">
              <h2 className="font-semibold text-zinc-900 mb-3">Ингредиенты</h2>
              <ul className="space-y-1">
                {ingredients.map((ing, i) => {
                  const alSlug = ing?.alcohol_product_slug?.trim();
                  const naSlug = ing?.na_product_slug?.trim();
                  const nameNode =
                    alSlug ? (
                      <Link
                        href={`/alcohol/${encodeURIComponent(alSlug)}`}
                        className="text-primary-600 hover:underline"
                      >
                        {String(ing?.name ?? "")}
                      </Link>
                    ) : naSlug ? (
                      <Link
                        href={`/na/${encodeURIComponent(naSlug)}`}
                        className="text-primary-600 hover:underline"
                      >
                        {String(ing?.name ?? "")}
                      </Link>
                    ) : (
                      <span>{String(ing?.name ?? "")}</span>
                    );
                  return (
                    <li key={i} className="text-zinc-700">
                      {String(ing?.amount ?? "")} {nameNode}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {item.instructions ? (
            <div id="howto" className="border-t border-zinc-200 p-6 scroll-mt-24">
              <h2 className="font-semibold text-zinc-900 mb-2">Приготовление</h2>
              <p className="text-zinc-700 text-sm whitespace-pre-wrap">
                {String(item.instructions)}
              </p>
            </div>
          ) : null}

          {item.cordials_recipe ? (
            <div className="border-t border-zinc-200 p-6">
              <h2 className="font-semibold text-zinc-900 mb-2">Дополнительно</h2>
              <p className="text-zinc-700 text-sm whitespace-pre-wrap">
                {String(item.cordials_recipe)}
              </p>
            </div>
          ) : null}

          {item.allergens ? (
            <div id="allergens" className="border-t border-zinc-200 p-6 scroll-mt-24">
              <h2 className="font-semibold text-zinc-900 mb-2">Аллергены</h2>
              <p className="text-zinc-700 text-sm whitespace-pre-wrap">
                {String(item.allergens)}
              </p>
            </div>
          ) : null}

          {(strength != null ||
            tasteDry != null ||
            (flavorProfile && Object.keys(flavorProfile).length > 0)) && (
            <div id="taste" className="border-t border-zinc-200 p-6 scroll-mt-24">
              <h2 className="font-semibold text-zinc-900 mb-4">Крепость и вкус</h2>
              {strength != null && !Number.isNaN(strength) && (
                <ScaleBar
                  value={strength}
                  leftLabel="Безалкогольно"
                  rightLabel="Крепко"
                  title="Крепость"
                />
              )}
              {tasteDry != null && !Number.isNaN(tasteDry) && (
                <ScaleBar
                  value={tasteDry}
                  leftLabel="Сладко"
                  rightLabel="Сухо / кисло"
                  title="Баланс сладости"
                />
              )}
              {flavorProfile && Object.keys(flavorProfile).length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-zinc-800">Доп. ноты</p>
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

          {item.history ? (
            <div id="history" className="border-t border-zinc-200 p-6 scroll-mt-24">
              <h2 className="font-semibold text-zinc-900 mb-2">История</h2>
              <p className="text-zinc-700 text-sm whitespace-pre-wrap">{String(item.history)}</p>
            </div>
          ) : null}

          {item.nutrition_note ? (
            <div id="nutrition" className="border-t border-zinc-200 p-6 scroll-mt-24">
              <h2 className="font-semibold text-zinc-900 mb-2">Питание</h2>
              <p className="text-zinc-700 text-sm whitespace-pre-wrap">
                {String(item.nutrition_note)}
              </p>
            </div>
          ) : null}

          {item.alcohol_content_note ? (
            <div id="alcohol" className="border-t border-zinc-200 p-6 scroll-mt-24">
              <h2 className="font-semibold text-zinc-900 mb-2">Содержание алкоголя</h2>
              <p className="text-zinc-700 text-sm whitespace-pre-wrap">
                {String(item.alcohol_content_note)}
              </p>
            </div>
          ) : null}

          {(item.author != null || item.bar_name != null) ? (() => {
            const social = item.social_links as Record<string, string> | null;
            const links = social && typeof social === "object" ? Object.entries(social).filter(([, v]) => v) : [];
            return (
              <div className="border-t border-zinc-200 p-6">
                <h2 className="font-semibold text-zinc-900 mb-2">
                  {item.is_classic ? "Рецепт предоставлен" : "Автор рецепта"}
                </h2>
                <p className="text-zinc-700 text-sm">
                  {[item.author, item.bar_name, item.bar_city].filter(Boolean).map(String).join(" · ")}
                </p>
                {item.bar_description ? (
                  <p className="text-zinc-600 text-sm mt-2 whitespace-pre-wrap">
                    {String(item.bar_description)}
                  </p>
                ) : null}
                {links.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {links.map(([key, url]) => (
                      <a
                        key={key}
                        href={String(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-primary-100 hover:text-primary-700 transition-colors"
                        title={key}
                      >
                        {key === "telegram" && <Send className="h-4 w-4" />}
                        {key === "youtube" && <Youtube className="h-4 w-4" />}
                        {key === "dzen" && (
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.1 0 2.08.4 2.87 1.06C13.65 7.39 12.87 9.12 12 11c-.87-1.88-1.65-3.61-2.87-4.94A4.96 4.96 0 0112 5zm-5 7c0-1.1.4-2.08 1.06-2.87C9.39 10.35 11.12 11.13 13 12c-1.88.87-3.61 1.65-4.94 2.87A4.96 4.96 0 017 12zm5 5c-1.1 0-2.08-.4-2.87-1.06C10.35 14.61 11.13 12.88 12 11c.87 1.88 1.65 3.61 2.87 4.94A4.96 4.96 0 0112 17zm5-5c0 1.1-.4 2.08-1.06 2.87C14.61 13.65 12.88 12.87 11 12c1.88-.87 3.61-1.65 4.94-2.87A4.96 4.96 0 0117 12z"/>
                          </svg>
                        )}
                        {!["telegram", "youtube", "dzen"].includes(key) && (
                          <span className="text-xs font-medium">{key.slice(0, 2).toUpperCase()}</span>
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })() : null}

          {tags && tags.length > 0 && (
            <div className="border-t border-zinc-200 p-6">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-md bg-zinc-100 text-zinc-600 text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>

        {related.length > 0 && (
          <aside className="mt-8 lg:mt-0 space-y-3">
            <p className="text-sm font-semibold text-zinc-900">Ещё коктейли</p>
            <ul className="space-y-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/cocktails/id/${r.id}`}
                    className="flex gap-2 group rounded-lg border border-zinc-100 p-2 hover:border-primary-200 hover:bg-primary-50/30 transition-colors"
                  >
                    <div className="w-14 h-14 shrink-0 bg-zinc-100 rounded overflow-hidden">
                      {r.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={r.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Martini className="h-6 w-6 text-zinc-300" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 group-hover:text-primary-700 truncate">
                        {r.name}
                      </p>
                      {r.description ? (
                        <p className="text-xs text-zinc-500 line-clamp-2 mt-0.5">{r.description}</p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
