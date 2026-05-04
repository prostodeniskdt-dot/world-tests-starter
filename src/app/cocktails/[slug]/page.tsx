import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import Link from "next/link";
import { Martini, ArrowLeft, Send, Youtube, Sparkles, Wind, UtensilsCrossed } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

type Row = Record<string, unknown>;

function safeDecodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

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
      <div className="relative h-2.5 bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-100 rounded-full overflow-visible ring-1 ring-zinc-200/80">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 opacity-35"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 h-4 w-4 -mt-2 rounded-full bg-primary-600 border-2 border-white shadow-md"
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
  const { slug: rawSlug } = await params;
  const slug = safeDecodeSlug(rawSlug);
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
  const { slug: rawSlug } = await params;
  const slug = safeDecodeSlug(rawSlug);
  const { rows } = await db.query(
    `SELECT c.*,
      NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), '') AS submitted_by_display_name
     FROM cocktails c
     LEFT JOIN users u ON u.id = c.submitted_by_user_id
     WHERE c.slug = $1 AND c.is_published = true`,
    [slug]
  );

  if (rows.length === 0) notFound();
  const item = rows[0] as Row;
  const ingredients = item.ingredients as
    | {
        name: string;
        amount: string;
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

  const tasteNotes = item.taste_notes ? String(item.taste_notes).trim() : "";
  const aromaNotes = item.aroma_notes ? String(item.aroma_notes).trim() : "";
  const pairingNotes = item.pairing_notes ? String(item.pairing_notes).trim() : "";
  const hasPalateText = Boolean(tasteNotes || aromaNotes || pairingNotes);
  const hasScales =
    strength != null ||
    tasteDry != null ||
    (flavorProfile && Object.keys(flavorProfile).length > 0);

  const navItems: { id: string; label: string }[] = [];
  if (ingredients && ingredients.length > 0) navItems.push({ id: "ingredients", label: "Ингредиенты" });
  if (item.instructions) navItems.push({ id: "howto", label: "Приготовление" });
  if (item.allergens) navItems.push({ id: "allergens", label: "Аллергены" });
  if (hasPalateText || hasScales) {
    navItems.push({ id: "palate", label: "Вкус, аромат и пейринг" });
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

        <article className="rounded-2xl border border-zinc-200/90 bg-white overflow-hidden min-w-0 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.18)] ring-1 ring-zinc-900/[0.04]">
          <div className="bg-gradient-to-br from-primary-500/[0.08] via-white to-amber-400/[0.06] px-5 pt-5 pb-1 sm:px-7 sm:pt-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div id="gallery" className="scroll-mt-24 space-y-3">
                <div className="aspect-square max-h-80 md:max-h-none rounded-2xl bg-zinc-100 flex items-center justify-center overflow-hidden ring-1 ring-zinc-900/5 shadow-inner">
                  {item.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.image_url as string}
                      alt={item.name as string}
                      className="w-full h-full object-cover"
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
                        className="h-16 w-16 object-cover rounded-xl border border-zinc-200/80 shadow-sm"
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center pb-4 md:pb-2">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                    {String(item.name)}
                  </h1>
                  {item.is_classic ? (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-600 text-white shadow-sm">
                      Классика
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-900/[0.06] text-zinc-700 ring-1 ring-zinc-900/10">
                      Авторский
                    </span>
                  )}
                </div>
                {(Boolean(item.method) ||
                  Boolean(item.glass) ||
                  Boolean(item.garnish) ||
                  Boolean(item.ice)) && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.method ? (
                      <span className="inline-flex items-center rounded-lg bg-white/90 px-2.5 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 shadow-sm">
                        {String(item.method)}
                      </span>
                    ) : null}
                    {item.glass ? (
                      <span className="inline-flex items-center rounded-lg bg-white/90 px-2.5 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 shadow-sm">
                        {String(item.glass)}
                      </span>
                    ) : null}
                    {item.garnish ? (
                      <span className="inline-flex items-center rounded-lg bg-white/90 px-2.5 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 shadow-sm">
                        {String(item.garnish)}
                      </span>
                    ) : null}
                    {item.ice ? (
                      <span className="inline-flex items-center rounded-lg bg-white/90 px-2.5 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 shadow-sm">
                        {String(item.ice)}
                      </span>
                    ) : null}
                  </div>
                )}
                {item.description ? (
                  <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">{String(item.description)}</p>
                ) : null}
              </div>
            </div>
          </div>

          {ingredients && ingredients.length > 0 && (
            <div id="ingredients" className="border-t border-zinc-100 p-6 sm:p-8 scroll-mt-24 bg-zinc-50/40">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                <span className="h-8 w-1 rounded-full bg-primary-500 shrink-0" aria-hidden />
                Ингредиенты
              </h2>
              <ul className="space-y-2.5">
                {ingredients.map((ing, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-zinc-800 rounded-xl bg-white/80 px-4 py-2.5 ring-1 ring-zinc-200/60"
                  >
                    <span className="font-medium text-primary-700 tabular-nums shrink-0 min-w-[4.5rem]">
                      {String(ing?.amount ?? "").trim() || "—"}
                    </span>
                    <span className="text-zinc-700">{String(ing?.name ?? "").trim()}</span>
                  </li>
                ))}
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

          {(hasPalateText || hasScales) && (
            <div id="palate" className="border-t border-zinc-100 p-6 sm:p-8 scroll-mt-24 space-y-8">
              <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                <span className="h-8 w-1 rounded-full bg-amber-500 shrink-0" aria-hidden />
                Вкус, аромат и пейринг
              </h2>

              {tasteNotes ? (
                <section className="rounded-2xl bg-gradient-to-br from-rose-50/80 to-white p-5 ring-1 ring-rose-100/80">
                  <h3 className="text-sm font-semibold text-zinc-900 mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-rose-500 shrink-0" aria-hidden />
                    Вкус
                  </h3>
                  <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{tasteNotes}</p>
                </section>
              ) : null}

              {aromaNotes ? (
                <section className="rounded-2xl bg-gradient-to-br from-violet-50/80 to-white p-5 ring-1 ring-violet-100/80">
                  <h3 className="text-sm font-semibold text-zinc-900 mb-2 flex items-center gap-2">
                    <Wind className="h-4 w-4 text-violet-500 shrink-0" aria-hidden />
                    Аромат
                  </h3>
                  <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{aromaNotes}</p>
                </section>
              ) : null}

              {pairingNotes ? (
                <section className="rounded-2xl bg-gradient-to-br from-emerald-50/80 to-white p-5 ring-1 ring-emerald-100/80">
                  <h3 className="text-sm font-semibold text-zinc-900 mb-2 flex items-center gap-2">
                    <UtensilsCrossed className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />
                    Пейринг
                  </h3>
                  <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{pairingNotes}</p>
                </section>
              ) : null}

              {hasScales ? (
                <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-5 sm:p-6">
                  <h3 className="text-sm font-semibold text-zinc-900 mb-4">Крепость и профиль</h3>
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
                    <div className="mt-2 space-y-3">
                      <p className="text-sm font-medium text-zinc-800">Ноты профиля</p>
                      {Object.entries(flavorProfile).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-sm text-zinc-600 w-32 sm:w-40 shrink-0 leading-snug">{key}</span>
                          <div className="flex-1 h-2.5 bg-zinc-200 rounded-full overflow-hidden ring-1 ring-zinc-200/80">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600"
                              style={{
                                width: `${Math.min(100, Math.max(0, Number(val) || 0))}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-zinc-500 w-8 tabular-nums text-right">{Number(val) || 0}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
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

          {(item.author != null ||
            item.bar_name != null ||
            item.classic_original_author != null ||
            item.submitted_by_display_name) ? (() => {
            const social = item.social_links as Record<string, string> | null;
            const links = social && typeof social === "object" ? Object.entries(social).filter(([, v]) => v) : [];
            const authorLine = [item.author, item.bar_name, item.bar_city].filter(Boolean).map(String).join(" · ");
            const submittedBy =
              item.submitted_by_display_name != null ? String(item.submitted_by_display_name).trim() : "";
            return (
              <div className="border-t border-zinc-100 p-6 sm:p-8 bg-gradient-to-b from-zinc-50/60 to-white">
                <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                  <span className="h-8 w-1 rounded-full bg-zinc-400 shrink-0" aria-hidden />
                  Авторство
                </h2>
                <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 space-y-3 shadow-sm">
                  {item.is_classic && item.classic_original_author ? (
                    <p className="text-zinc-800 text-sm leading-relaxed">
                      <span className="font-medium text-zinc-900">Автор оригинального рецепта: </span>
                      {String(item.classic_original_author)}
                    </p>
                  ) : null}
                  {authorLine && (
                    <p className="text-zinc-800 text-sm leading-relaxed">
                      <span className="font-medium text-zinc-900">
                        {item.is_classic ? "Рецепт для сайта подготовил: " : "Автор рецепта: "}
                      </span>
                      {authorLine}
                    </p>
                  )}
                  {submittedBy ? (
                    <p className="text-zinc-600 text-sm border-t border-zinc-100 pt-3 mt-1">
                      <span className="font-medium text-zinc-700">Заявку на сайт подал: </span>
                      {submittedBy}
                      <span className="text-zinc-500">
                        {" "}
                        (аккаунт; может совпадать или не совпадать с автором рецепта).
                      </span>
                    </p>
                  ) : null}
                  {item.bar_description ? (
                    <p className="text-zinc-600 text-sm whitespace-pre-wrap leading-relaxed">
                      {String(item.bar_description)}
                    </p>
                  ) : null}
                  {links.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {links.map(([key, url]) => (
                        <a
                          key={key}
                          href={String(url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-primary-100 hover:text-primary-700 transition-colors ring-1 ring-zinc-200/80"
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
              </div>
            );
          })() : null}

          {tags && tags.length > 0 && (
            <div className="border-t border-zinc-100 p-6 sm:p-8">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-sm font-medium ring-1 ring-zinc-200/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>

        {related.length > 0 && (
          <aside className="mt-8 lg:mt-0 space-y-4">
            <p className="text-sm font-semibold text-zinc-900 tracking-tight">Ещё коктейли</p>
            <ul className="space-y-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/cocktails/id/${r.id}`}
                    className="flex gap-3 group rounded-2xl border border-zinc-200/80 bg-white p-2.5 shadow-sm hover:shadow-md hover:border-primary-300/80 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="w-16 h-16 shrink-0 bg-zinc-100 rounded-xl overflow-hidden ring-1 ring-zinc-900/5">
                      {r.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={r.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Martini className="h-7 w-7 text-zinc-300" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 py-0.5">
                      <p className="text-sm font-semibold text-zinc-900 group-hover:text-primary-700 transition-colors line-clamp-2">
                        {r.name}
                      </p>
                      {r.description ? (
                        <p className="text-xs text-zinc-500 line-clamp-2 mt-1 leading-snug">{r.description}</p>
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
