import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import Link from "next/link";
import { Wrench, ArrowLeft, BookOpen } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { PRICE_SEGMENT_LABELS } from "@/lib/techniqueLabels";
import { EquipmentReviewForm } from "@/components/EquipmentReviewForm";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

type KeySpec = { name: string; value: string };
type PurchaseLink = { label: string; url: string };

function parseKeySpecs(raw: unknown): KeySpec[] {
  if (!Array.isArray(raw)) return [];
  const out: KeySpec[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const name = String(o.name ?? "").trim();
    const value = String(o.value ?? "").trim();
    if (name) out.push({ name, value });
  }
  return out;
}

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { rows } = await db.query(
      "SELECT name, description, image_url FROM equipment WHERE slug = $1 AND is_published = true",
      [slug]
    );
    if (rows.length === 0) return { title: `Оборудование | ${SITE_NAME}` };
    const item = rows[0] as Row;
    const title = `${String(item.name)} | Оборудование | ${SITE_NAME}`;
    const desc = item.description ? String(item.description).slice(0, 160) : undefined;
    const img = item.image_url ? String(item.image_url) : undefined;
    return { title, description: desc, openGraph: img ? { images: [{ url: img }] } : undefined };
  } catch {
    return { title: `Оборудование | ${SITE_NAME}` };
  }
}

export default async function EquipmentProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { rows } = await db.query(
    `SELECT e.*, c.name AS category_name
     FROM equipment e
     LEFT JOIN equipment_categories c ON c.id = e.category_id
     WHERE e.slug = $1 AND e.is_published = true`,
    [slug]
  );

  if (rows.length === 0) notFound();
  const item = rows[0] as Row;
  const pid = item.id as number;

  const keySpecs = parseKeySpecs(item.key_specs);
  const legacySpecs = item.specs as Record<string, unknown> | null;
  const purchaseLinks = parsePurchaseLinks(item.purchase_links);
  const gallery = parseGallery(item.gallery_urls);
  const tags = (Array.isArray(item.tags) ? item.tags : []) as string[];

  type G = { id: number; name: string; slug: string; short_description: string | null };
  let guides: G[] = [];
  try {
    const gr = await db.query(
      `SELECT g.id, g.name, g.slug, g.short_description
       FROM technique_guides g
       INNER JOIN equipment_technique_links l ON l.guide_id = g.id
       WHERE l.equipment_id = $1 AND g.is_published = true
       ORDER BY g.name ASC`,
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
      `SELECT e2.id, e2.name, e2.slug, e2.image_url
       FROM equipment_substitutes s
       JOIN equipment e2 ON e2.id = (CASE WHEN s.product_id = $1 THEN s.substitute_id ELSE s.product_id END)
       WHERE (s.product_id = $1 OR s.substitute_id = $1) AND e2.is_published = true
       ORDER BY e2.name ASC`,
      [pid]
    );
    substitutes = sr.rows as S[];
  } catch {
    substitutes = [];
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

  let avgRating: number | null = null;
  let reviewCount = 0;
  type RevRow = {
    id: number;
    rating: number;
    review_text: string | null;
    usage_duration: string | null;
    created_at: Date;
    first_name: string | null;
    last_name: string | null;
  };
  let reviews: RevRow[] = [];
  try {
    const agg = await db.query(
      `SELECT COALESCE(AVG(rating), 0)::float AS avg, COUNT(*)::int AS c
       FROM equipment_reviews WHERE equipment_id = $1 AND status = 'approved'`,
      [pid]
    );
    const a = agg.rows[0] as { avg: number; c: number };
    avgRating = a.c > 0 ? Math.round(a.avg * 10) / 10 : null;
    reviewCount = a.c;
    const rr = await db.query(
      `SELECT r.id, r.rating, r.review_text, r.usage_duration, r.created_at,
              u.first_name, u.last_name
       FROM equipment_reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.equipment_id = $1 AND r.status = 'approved'
       ORDER BY r.created_at DESC
       LIMIT 40`,
      [pid]
    );
    reviews = rr.rows as RevRow[];
  } catch {
    avgRating = null;
    reviewCount = 0;
    reviews = [];
  }

  const priceSeg =
    item.price_segment != null
      ? PRICE_SEGMENT_LABELS[String(item.price_segment)] ?? String(item.price_segment)
      : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/technique/equipment"
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Оборудование
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
                <Wrench className="h-24 w-24 text-zinc-300" />
              )}
            </div>
            {gallery.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {gallery.map((u) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <a key={u} href={u} target="_blank" rel="noreferrer" className="block w-20 h-20 rounded border overflow-hidden">
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
            </div>
            {item.producer ? (
              <p className="text-sm text-zinc-600 mb-2">{String(item.producer)}</p>
            ) : null}
            {reviewCount > 0 && avgRating != null ? (
              <p className="text-sm text-amber-700 mb-2">
                ★ {avgRating} · {reviewCount} отзывов
              </p>
            ) : null}
            {priceSeg || item.price_range ? (
              <p className="text-sm text-zinc-700 mb-2">
                {priceSeg ? <span>{priceSeg}</span> : null}
                {item.price_range ? (
                  <span className="ml-2 text-zinc-600">· {String(item.price_range)}</span>
                ) : null}
              </p>
            ) : null}
            {item.audience ? (
              <p className="text-sm text-zinc-600 mb-3">
                <span className="text-zinc-500">Для кого:</span> {String(item.audience)}
              </p>
            ) : null}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tags.map((t) => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-primary-50 text-primary-800">
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

        {(keySpecs.length > 0 ||
          (legacySpecs && Object.keys(legacySpecs).length > 0)) && (
          <div className="border-t border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-3">Ключевые параметры</h2>
            {keySpecs.length > 0 ? (
              <dl className="grid sm:grid-cols-2 gap-2 text-sm">
                {keySpecs.map((kv) => (
                  <div key={kv.name} className="flex justify-between gap-2 border-b border-zinc-50 pb-1">
                    <dt className="text-zinc-600">{kv.name}</dt>
                    <dd className="font-medium text-zinc-900 text-right">{kv.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <dl className="grid sm:grid-cols-2 gap-2 text-sm">
                {Object.entries(legacySpecs!).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <dt className="text-zinc-600 capitalize">{k}</dt>
                    <dd className="font-medium text-zinc-900">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}

        {purchaseLinks.length > 0 && (
          <div className="border-t border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-2">Где купить</h2>
            <ul className="text-sm space-y-1">
              {purchaseLinks.map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(Boolean(item.experience_pros) ||
          Boolean(item.experience_cons) ||
          Boolean(item.ideal_for) ||
          Boolean(item.not_suitable_for) ||
          Boolean(item.recommendations)) && (
          <div className="border-t border-zinc-200 p-6 space-y-4">
            <h2 className="font-semibold text-zinc-900">Опыт использования</h2>
            {item.experience_pros ? (
              <div>
                <h3 className="text-sm font-medium text-zinc-800 mb-1">Плюсы</h3>
                <p className="text-sm text-zinc-700 whitespace-pre-wrap">{String(item.experience_pros)}</p>
              </div>
            ) : null}
            {item.experience_cons ? (
              <div>
                <h3 className="text-sm font-medium text-zinc-800 mb-1">Минусы</h3>
                <p className="text-sm text-zinc-700 whitespace-pre-wrap">{String(item.experience_cons)}</p>
              </div>
            ) : null}
            {item.ideal_for ? (
              <div>
                <h3 className="text-sm font-medium text-zinc-800 mb-1">Идеально для</h3>
                <p className="text-sm text-zinc-700 whitespace-pre-wrap">{String(item.ideal_for)}</p>
              </div>
            ) : null}
            {item.not_suitable_for ? (
              <div>
                <h3 className="text-sm font-medium text-zinc-800 mb-1">Не подходит для</h3>
                <p className="text-sm text-zinc-700 whitespace-pre-wrap">{String(item.not_suitable_for)}</p>
              </div>
            ) : null}
            {item.recommendations ? (
              <div>
                <h3 className="text-sm font-medium text-zinc-800 mb-1">Рекомендации</h3>
                <p className="text-sm text-zinc-700 whitespace-pre-wrap">{String(item.recommendations)}</p>
              </div>
            ) : null}
          </div>
        )}

        {guides.length > 0 && (
          <div className="border-t border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-3">Используется в приёмах</h2>
            <ul className="space-y-2">
              {guides.map((g) => (
                <li key={g.id}>
                  <Link href={`/technique/skills/${g.slug}`} className="text-primary-600 hover:underline font-medium">
                    {g.name}
                  </Link>
                  {g.short_description ? (
                    <p className="text-xs text-zinc-500 mt-0.5">{g.short_description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}

        {substitutes.length > 0 && (
          <div className="border-t border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-3">Аналоги и альтернативы</h2>
            <ul className="grid sm:grid-cols-2 gap-2">
              {substitutes.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/technique/equipment/${encodeURIComponent(s.slug)}`}
                    className="text-sm text-primary-600 hover:underline"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {articleLink && (
          <div className="border-t border-zinc-200 p-6">
            <Link
              href={`/knowledge/${encodeURIComponent(articleLink.slug)}`}
              className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-800 hover:bg-primary-100"
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              Статья: {articleLink.title}
            </Link>
          </div>
        )}

        <div className="border-t border-zinc-200 p-6">
          <h2 className="font-semibold text-zinc-900 mb-3">Отзывы</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-zinc-500 mb-4">Пока нет одобренных отзывов.</p>
          ) : (
            <ul className="space-y-4 mb-6">
              {reviews.map((r) => {
                const who = [r.first_name, r.last_name].filter(Boolean).join(" ") || "Пользователь";
                return (
                  <li key={r.id} className="border-b border-zinc-100 pb-3 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium text-zinc-900">{who}</span>
                      <span className="text-amber-600">★ {r.rating}</span>
                    </div>
                    {r.usage_duration ? (
                      <p className="text-xs text-zinc-500 mt-0.5">{r.usage_duration}</p>
                    ) : null}
                    {r.review_text ? (
                      <p className="text-zinc-700 mt-2 whitespace-pre-wrap">{r.review_text}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          <h3 className="text-sm font-medium text-zinc-800 mb-2">Оставить отзыв</h3>
          <EquipmentReviewForm equipmentSlug={slug} />
        </div>
      </article>
    </div>
  );
}
