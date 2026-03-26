import Link from "next/link";
import { notFound } from "next/navigation";
import { Package, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type PrepItem = Record<string, unknown> & {
  name?: string;
  slug?: string;
  image_url?: string | null;
  composition?: string | null;
  ingredients?: unknown;
  tags?: string[] | null;
  author?: string | null;
  bar_name?: string | null;
  bar_city?: string | null;
  bar_description?: string | null;
  social_links?: Record<string, string> | null;
};

function normalizeIngredientRows(raw: unknown): { name: string; amount: string }[] {
  if (!Array.isArray(raw)) return [];
  const out: { name: string; amount: string }[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const name = String(o.name ?? "").trim();
    const amount = String(o.amount ?? "").trim();
    if (!name && !amount) continue;
    out.push({ name, amount });
    if (out.length >= 80) break;
  }
  return out;
}

export default async function PrepPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { rows } = await db.query(
    `SELECT * FROM preps WHERE slug = $1 AND is_published = true`,
    [slug]
  );
  if (rows.length === 0) return notFound();

  const item = rows[0] as PrepItem;
  const ingredients = normalizeIngredientRows(item.ingredients);
  const tags = Array.isArray(item.tags) ? item.tags.map(String).filter(Boolean) : [];
  const social =
    item.social_links && typeof item.social_links === "object" ? (item.social_links as Record<string, string>) : null;
  const links = social ? Object.entries(social).filter(([, v]) => v) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/preps" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-6">
        ← Заготовки
      </Link>

      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
        <div className="aspect-[16/9] bg-zinc-100 flex items-center justify-center">
          {item.image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={String(item.image_url)}
              alt={String(item.name || "Заготовка")}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="h-16 w-16 text-zinc-300" />
          )}
        </div>

        <div className="p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">{String(item.name || "Заготовка")}</h1>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tags.map((t) => (
                <span key={t} className="px-2 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium">
                  {t}
                </span>
              ))}
            </div>
          )}

          {item.composition ? (
            <div className="mt-6">
              <h2 className="font-semibold text-zinc-900 mb-2">Состав</h2>
              <p className="text-zinc-700 whitespace-pre-wrap">{String(item.composition)}</p>
            </div>
          ) : null}

          {ingredients.length > 0 && (
            <div className="mt-6">
              <h2 className="font-semibold text-zinc-900 mb-2">Ингредиенты</h2>
              <div className="rounded-xl border border-zinc-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-zinc-600 font-medium">Ингредиент</th>
                      <th className="text-left px-4 py-2 text-zinc-600 font-medium w-40">Количество</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredients.map((r, idx) => (
                      <tr key={idx} className="border-t border-zinc-200">
                        <td className="px-4 py-2 text-zinc-900">{r.name || "—"}</td>
                        <td className="px-4 py-2 text-zinc-700">{r.amount || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-zinc-200 p-6">
          <h2 className="font-semibold text-zinc-900 mb-2">Информация об авторстве</h2>
          <p className="text-zinc-700 text-sm">
            Автор: {[item.author, item.bar_name, item.bar_city].filter(Boolean).map(String).join(" · ") || "Не указан"}
          </p>
          {item.bar_description ? (
            <p className="text-zinc-600 text-sm mt-2 whitespace-pre-wrap">{String(item.bar_description)}</p>
          ) : null}
          {links.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {links.map(([key, url]) => (
                <a
                  key={key}
                  href={String(url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-800 hover:bg-primary-100 min-h-[36px]"
                >
                  {key}
                  <ExternalLink className="h-3 w-3 flex-shrink-0" aria-hidden />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

