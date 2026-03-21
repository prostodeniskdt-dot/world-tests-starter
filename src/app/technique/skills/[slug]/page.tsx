import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import Link from "next/link";
import { GraduationCap, ArrowLeft, BookOpen, Martini, Wrench, Wine, Coffee } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { DIFFICULTY_LABELS } from "@/lib/techniqueLabels";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

function parseGallery(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((u) => typeof u === "string" && u.trim()).map(String);
}

function parseCocktailSlugs(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, 40);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { rows } = await db.query(
      "SELECT name, short_description FROM technique_guides WHERE slug = $1 AND is_published = true",
      [slug]
    );
    if (rows.length === 0) return { title: `Приёмы | ${SITE_NAME}` };
    const item = rows[0] as Row;
    const title = `${String(item.name)} | Приёмы | ${SITE_NAME}`;
    const desc = item.short_description ? String(item.short_description).slice(0, 160) : undefined;
    return { title, description: desc };
  } catch {
    return { title: `Приёмы | ${SITE_NAME}` };
  }
}

export default async function TechniqueGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { rows } = await db.query(
    `SELECT g.*, c.name AS category_name
     FROM technique_guides g
     LEFT JOIN technique_guide_categories c ON c.id = g.category_id
     WHERE g.slug = $1 AND g.is_published = true`,
    [slug]
  );

  if (rows.length === 0) notFound();
  const item = rows[0] as Row;
  const gid = item.id as number;

  const gallery = parseGallery(item.gallery_urls);
  const cocktailSlugs = parseCocktailSlugs(item.cocktail_slugs);

  type E = { id: number; name: string; slug: string; image_url: string | null };
  let equipment: E[] = [];
  try {
    const er = await db.query(
      `SELECT e.id, e.name, e.slug, e.image_url
       FROM equipment e
       INNER JOIN equipment_technique_links l ON l.equipment_id = e.id
       WHERE l.guide_id = $1 AND e.is_published = true
       ORDER BY e.name ASC`,
      [gid]
    );
    equipment = er.rows as E[];
  } catch {
    equipment = [];
  }

  let naSlugs: string[] = [];
  let alcoholSlugs: string[] = [];
  try {
    const nr = await db.query(
      `SELECT na_product_slug FROM technique_guide_na_links WHERE guide_id = $1 ORDER BY na_product_slug`,
      [gid]
    );
    naSlugs = nr.rows.map((r: { na_product_slug: string }) => r.na_product_slug);
    const ar = await db.query(
      `SELECT alcohol_product_slug FROM technique_guide_alcohol_links WHERE guide_id = $1 ORDER BY alcohol_product_slug`,
      [gid]
    );
    alcoholSlugs = ar.rows.map((r: { alcohol_product_slug: string }) => r.alcohol_product_slug);
  } catch {
    naSlugs = [];
    alcoholSlugs = [];
  }

  type CockRow = { name: string; slug: string };
  let cocktails: CockRow[] = [];
  if (cocktailSlugs.length > 0) {
    try {
      const cr = await db.query(
        `SELECT name, slug FROM cocktails WHERE is_published = true AND slug = ANY($1::text[]) ORDER BY name`,
        [cocktailSlugs]
      );
      cocktails = cr.rows as CockRow[];
    } catch {
      cocktails = [];
    }
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

  const tags = (Array.isArray(item.tags) ? item.tags : []) as string[];
  const diff =
    item.difficulty != null
      ? DIFFICULTY_LABELS[String(item.difficulty)] ?? String(item.difficulty)
      : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/technique/skills"
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Приёмы и техники
      </Link>

      <article className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-soft">
        <div className="p-6 border-b border-zinc-100">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <GraduationCap className="h-8 w-8 text-primary-600 shrink-0" />
            <h1 className="text-2xl font-bold text-zinc-900">{String(item.name)}</h1>
          </div>
          {item.category_name ? (
            <p className="text-sm text-primary-700 mb-1">{String(item.category_name)}</p>
          ) : null}
          {diff ? <p className="text-sm text-zinc-600 mb-2">Сложность: {diff}</p> : null}
          {item.short_description ? (
            <p className="text-zinc-700 text-sm">{String(item.short_description)}</p>
          ) : null}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {item.video_url ? (
          <div className="p-6 border-b border-zinc-100">
            <h2 className="font-semibold text-zinc-900 mb-2">Видео</h2>
            <a
              href={String(item.video_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline text-sm break-all"
            >
              {String(item.video_url)}
            </a>
          </div>
        ) : null}

        {gallery.length > 0 && (
          <div className="p-6 border-b border-zinc-100">
            <h2 className="font-semibold text-zinc-900 mb-3">Фото</h2>
            <div className="flex flex-wrap gap-2">
              {gallery.map((u) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <a key={u} href={u} target="_blank" rel="noreferrer" className="block w-32 h-32 rounded-lg border overflow-hidden">
                  <img src={u} alt="" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}

        {item.instruction_text ? (
          <div className="p-6 border-b border-zinc-100">
            <h2 className="font-semibold text-zinc-900 mb-3">Пошаговая инструкция</h2>
            <div className="text-sm text-zinc-700 whitespace-pre-wrap">{String(item.instruction_text)}</div>
          </div>
        ) : null}

        {item.typical_mistakes ? (
          <div className="p-6 border-b border-zinc-100">
            <h2 className="font-semibold text-zinc-900 mb-2">Типичные ошибки</h2>
            <p className="text-sm text-zinc-700 whitespace-pre-wrap">{String(item.typical_mistakes)}</p>
          </div>
        ) : null}

        {item.tips ? (
          <div className="p-6 border-b border-zinc-100">
            <h2 className="font-semibold text-zinc-900 mb-2">Советы и лайфхаки</h2>
            <p className="text-sm text-zinc-700 whitespace-pre-wrap">{String(item.tips)}</p>
          </div>
        ) : null}

        {equipment.length > 0 && (
          <div className="p-6 border-b border-zinc-100">
            <h2 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
              <Wrench className="h-4 w-4" /> Оборудование
            </h2>
            <ul className="space-y-2">
              {equipment.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/technique/equipment/${encodeURIComponent(e.slug)}`}
                    className="text-primary-600 hover:underline font-medium text-sm"
                  >
                    {e.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(naSlugs.length > 0 || alcoholSlugs.length > 0) && (
          <div className="p-6 border-b border-zinc-100 space-y-4">
            {naSlugs.length > 0 && (
              <div>
                <h2 className="font-semibold text-zinc-900 mb-2 flex items-center gap-2 text-sm">
                  <Coffee className="h-4 w-4" /> Б/А ингредиенты
                </h2>
                <ul className="text-sm space-y-1">
                  {naSlugs.map((s) => (
                    <li key={s}>
                      <Link href={`/na/${encodeURIComponent(s)}`} className="text-primary-600 hover:underline">
                        {s}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {alcoholSlugs.length > 0 && (
              <div>
                <h2 className="font-semibold text-zinc-900 mb-2 flex items-center gap-2 text-sm">
                  <Wine className="h-4 w-4" /> Алкоголь
                </h2>
                <ul className="text-sm space-y-1">
                  {alcoholSlugs.map((s) => (
                    <li key={s}>
                      <Link href={`/alcohol/${encodeURIComponent(s)}`} className="text-primary-600 hover:underline">
                        {s}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {cocktails.length > 0 && (
          <div className="p-6 border-b border-zinc-100">
            <h2 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
              <Martini className="h-4 w-4" /> Рецепты
            </h2>
            <ul className="space-y-2">
              {cocktails.map((c) => (
                <li key={c.slug}>
                  <Link href={`/cocktails/${encodeURIComponent(c.slug)}`} className="text-primary-600 hover:underline text-sm">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {articleLink && (
          <div className="p-6">
            <Link
              href={`/knowledge/${encodeURIComponent(articleLink.slug)}`}
              className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-800 hover:bg-primary-100"
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              Статья: {articleLink.title}
            </Link>
          </div>
        )}
      </article>
    </div>
  );
}
