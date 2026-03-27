import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import Link from "next/link";
import { UtensilsCrossed, ArrowLeft, BookOpen } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { PRICE_SEGMENT_LABELS } from "@/lib/techniqueLabels";
import { GlasswareDrinkPhotoForm } from "@/components/GlasswareDrinkPhotoForm";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
type PurchaseLink = { label: string; url: string };

function parsePurchaseLinks(raw: unknown): PurchaseLink[] {
  if (!Array.isArray(raw)) return [];
  const out: PurchaseLink[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const label = String(o.label ?? "").trim() || "Ссылка";
    const url = String(o.url ?? "").trim();
    if (url.startsWith("http")) out.push({ label, url });
  }
  return out;
}

function parseGallery(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((u) => typeof u === "string" && u.trim()).map(String);
}

function safeDecodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
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
      "SELECT name, description, image_url FROM glassware WHERE slug = $1 AND is_published = true",
      [slug]
    );
    if (rows.length === 0) return { title: `Посуда | ${SITE_NAME}` };
    const item = rows[0] as Row;
    const title = `${String(item.name)} | Посуда | ${SITE_NAME}`;
    const desc = item.description ? String(item.description).slice(0, 160) : undefined;
    const img = item.image_url ? String(item.image_url) : undefined;
    return { title, description: desc, openGraph: img ? { images: [{ url: img }] } : undefined };
  } catch {
    return { title: `Посуда | ${SITE_NAME}` };
  }
}

export default async function GlasswareProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = safeDecodeSlug(rawSlug);
  const { rows } = await db.query(
    `SELECT g.*, c.name AS category_name
     FROM glassware g
     LEFT JOIN glassware_categories c ON c.id = g.category_id
     WHERE g.slug = $1 AND g.is_published = true`,
    [slug]
  );

  if (rows.length === 0) notFound();
  const item = rows[0] as Row;
  const pid = item.id as number;

  const purchaseLinks = parsePurchaseLinks(item.purchase_links);
  const gallery = parseGallery(item.gallery_urls);
  const tags = (Array.isArray(item.tags) ? item.tags : []) as string[];

  type G = { id: number; name: string; slug: string; short_description: string | null };
  let guides: G[] = [];
  try {
    const gr = await db.query(
      `SELECT t.id, t.name, t.slug, t.short_description
       FROM technique_guides t
       INNER JOIN glassware_technique_links l ON l.guide_id = t.id
       WHERE l.glassware_id = $1 AND t.is_published = true
       ORDER BY t.name ASC`,
      [pid]
    );
    guides = gr.rows as G[];
  } catch {
    guides = [];
  }

  type S = { id: number; name: string; slug: string; image_url: string | null };
  let substitutes: S[] = [];
  try {
    const sr = await db.query(
      `SELECT g2.id, g2.name, g2.slug, g2.image_url
       FROM glassware_substitutes s
       JOIN glassware g2 ON g2.id = (CASE WHEN s.product_id = $1 THEN s.substitute_id ELSE s.product_id END)
       WHERE (s.product_id = $1 OR s.substitute_id = $1) AND g2.is_published = true
       ORDER BY g2.name ASC`,
      [pid]
    );
    substitutes = sr.rows as S[];
  } catch {
    substitutes = [];
  }

  type PhotoRow = {
    id: number;
    image_url: string;
    caption: string | null;
    first_name: string | null;
    last_name: string | null;
  };
  let drinkPhotos: PhotoRow[] = [];
  try {
    const dp = await db.query(
      `SELECT p.id, p.image_url, p.caption, u.first_name, u.last_name
       FROM glassware_drink_photos p
       JOIN users u ON u.id = p.user_id
       WHERE p.glassware_id = $1 AND p.status = 'approved'
       ORDER BY p.created_at DESC
       LIMIT 60`,
      [pid]
    );
    drinkPhotos = dp.rows as PhotoRow[];
  } catch {
    drinkPhotos = [];
  }

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

  const priceSeg =
    item.price_segment != null
      ? PRICE_SEGMENT_LABELS[String(item.price_segment)] ?? String(item.price_segment)
      : null;

  const scores = [
    { key: "practicality_score", label: "Практичность", val: item.practicality_score },
    { key: "aesthetics_score", label: "Эстетика", val: item.aesthetics_score },
    { key: "durability_score", label: "Долговечность", val: item.durability_score },
  ].filter((s) => {
    const n = Number(s.val);
    return s.val != null && !Number.isNaN(n) && n >= 1 && n <= 5;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/glassware"
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Посуда
      </Link>

      <article className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-soft">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div className="space-y-3">
            <div className="aspect-square max-h-96 bg-zinc-100 rounded-lg overflow-hidden flex items-center justify-center">
              {item.image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={item.image_url as string}
                  alt={item.name as string}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UtensilsCrossed className="h-24 w-24 text-zinc-300" />
              )}
            </div>
            {gallery.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {gallery.map((u) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <a
                    key={u}
                    href={u}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-20 h-20 rounded border overflow-hidden"
                  >
                    <img src={u} alt="" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-zinc-900">{String(item.name)}</h1>
              {item.category_name ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                  {String(item.category_name)}
                </span>
              ) : null}
              {item.subcategory_text ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-800">
                  {String(item.subcategory_text)}
                </span>
              ) : null}
            </div>
            {item.producer ? (
              <p className="text-sm text-zinc-600 mb-2">{String(item.producer)}</p>
            ) : null}
            {(priceSeg || item.price_range) ? (
              <p className="text-sm text-zinc-700 mb-2">
                {priceSeg ? <span>{String(priceSeg)}</span> : null}
                {item.price_range ? (
                  <span className="ml-2 text-zinc-600">· {String(item.price_range)}</span>
                ) : null}
              </p>
            ) : null}
            {(Boolean(item.material) || Boolean(item.volume) || item.volume_ml != null || Boolean(item.dimensions)) && (
              <dl className="text-sm text-zinc-600 space-y-0.5 mb-3">
                {item.material ? (
                  <div>
                    <dt className="inline font-medium text-zinc-500">Материал: </dt>
                    <dd className="inline">{String(item.material)}</dd>
                  </div>
                ) : null}
                {(item.volume_ml != null || Boolean(item.volume)) && (
                  <div>
                    <dt className="inline font-medium text-zinc-500">Объём: </dt>
                    <dd className="inline">
                      {item.volume_ml != null ? `${item.volume_ml} мл` : String(item.volume)}
                    </dd>
                  </div>
                )}
                {item.dimensions ? (
                  <div>
                    <dt className="inline font-medium text-zinc-500">Размеры: </dt>
                    <dd className="inline">{String(item.dimensions)}</dd>
                  </div>
                ) : null}
              </dl>
            )}
            {item.audience ? (
              <p className="text-sm text-zinc-600 mb-3">
                <span className="text-zinc-500">Для кого:</span> {String(item.audience)}
              </p>
            ) : null}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 rounded-md bg-primary-50 text-primary-800"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            {item.description ? (
              <div className="prose prose-sm text-zinc-700 max-w-none">
                <p>{String(item.description)}</p>
              </div>
            ) : null}
          </div>
        </div>

        {drinkPhotos.length > 0 && (
          <div className="border-t border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-3">Фото с напитками</h2>
            <p className="text-sm text-zinc-600 mb-4">
              Реальные фото коктейлей и напитков в этой посуде от пользователей
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {drinkPhotos.map((p) => (
                <div key={p.id} className="rounded-lg overflow-hidden border border-zinc-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <a href={p.image_url} target="_blank" rel="noreferrer" className="block aspect-square">
                    <img
                      src={p.image_url}
                      alt={p.caption || ""}
                      className="w-full h-full object-cover"
                    />
                  </a>
                  {(p.caption || p.first_name || p.last_name) && (
                    <div className="p-2 text-xs text-zinc-600 truncate">
                      {p.caption || [p.first_name, p.last_name].filter(Boolean).join(" ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-100">
              <h3 className="text-sm font-medium text-zinc-800 mb-2">Добавить своё фото</h3>
              <GlasswareDrinkPhotoForm glasswareId={pid} />
            </div>
          </div>
        )}

        {drinkPhotos.length === 0 && (
          <div className="border-t border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-3">Фото с напитками</h2>
            <p className="text-sm text-zinc-600 mb-4">
              Поделитесь фото коктейля или напитка в этой посуде — это поможет другим барменам
            </p>
            <GlasswareDrinkPhotoForm glasswareId={pid} />
          </div>
        )}

        {(Boolean(item.ideal_for_drinks) ||
          Boolean(item.not_suitable_for) ||
          Boolean(item.experience_pros) ||
          Boolean(item.experience_cons) ||
          scores.length > 0) && (
          <div className="border-t border-zinc-200 p-6 space-y-4">
            <h2 className="font-semibold text-zinc-900">Опыт использования</h2>
            {item.ideal_for_drinks ? (
              <div>
                <h3 className="text-sm font-medium text-zinc-800 mb-1">Для каких напитков подходит</h3>
                <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                  {String(item.ideal_for_drinks)}
                </p>
              </div>
            ) : null}
            {item.not_suitable_for ? (
              <div>
                <h3 className="text-sm font-medium text-zinc-800 mb-1">Для чего не подходит</h3>
                <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                  {String(item.not_suitable_for)}
                </p>
              </div>
            ) : null}
            {item.experience_pros ? (
              <div>
                <h3 className="text-sm font-medium text-zinc-800 mb-1">Плюсы</h3>
                <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                  {String(item.experience_pros)}
                </p>
              </div>
            ) : null}
            {item.experience_cons ? (
              <div>
                <h3 className="text-sm font-medium text-zinc-800 mb-1">Минусы</h3>
                <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                  {String(item.experience_cons)}
                </p>
              </div>
            ) : null}
            {scores.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-zinc-800 mb-2">Оценки</h3>
                <div className="flex flex-wrap gap-4">
                  {scores.map((s) => (
                    <div key={s.key} className="flex items-center gap-2">
                      <span className="text-sm text-zinc-600">{s.label}:</span>
                      <span className="font-medium">{String(s.val)}/5</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {purchaseLinks.length > 0 && (
          <div className="border-t border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-2">Где купить</h2>
            <ul className="text-sm space-y-1">
              {purchaseLinks.map((l) => (
                <li key={l.url}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(substitutes.length > 0 || guides.length > 0 || articleLink) && (
          <div className="border-t border-zinc-200 p-6 space-y-4">
            <h2 className="font-semibold text-zinc-900">Связи</h2>
            {substitutes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-zinc-800 mb-1">Аналоги</h3>
                <ul className="flex flex-wrap gap-2">
                  {substitutes.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/glassware/${s.slug}`}
                        className="text-primary-600 hover:underline font-medium"
                      >
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {guides.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-zinc-800 mb-1">Связанные приёмы</h3>
                <ul className="flex flex-wrap gap-2">
                  {guides.map((g) => (
                    <li key={g.id}>
                      <Link
                        href={`/technique/skills/${g.slug}`}
                        className="text-primary-600 hover:underline font-medium"
                      >
                        {g.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {articleLink && (
              <div>
                <Link
                  href={`/knowledge/${articleLink.slug}`}
                  className="inline-flex items-center gap-1 text-primary-600 hover:underline"
                >
                  <BookOpen className="h-4 w-4" />
                  {articleLink.title}
                </Link>
              </div>
            )}
          </div>
        )}
      </article>
    </div>
  );
}
