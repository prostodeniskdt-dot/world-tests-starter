import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Wine, ArrowLeft } from "lucide-react";

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
  const item = rows[0] as Record<string, unknown>;

  const flavorProfile = item.flavor_profile as Record<string, number> | null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/alcohol"
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Алкоголь
      </Link>

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-soft">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div className="aspect-square max-h-80 md:max-h-none bg-zinc-100 rounded-lg flex items-center justify-center">
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
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">{String(item.name)}</h1>
            {(item.country != null || item.producer != null) ? (
              <p className="text-zinc-600 text-sm mb-4">
                {[item.country, item.producer].filter(Boolean).map(String).join(" • ")}
              </p>
            ) : null}
            {item.abv != null && (
              <p className="text-sm font-medium text-zinc-700 mb-4">
                Крепость: {Number(item.abv)}% ABV
              </p>
            )}
            {item.description ? (
              <div className="prose prose-sm text-zinc-700 max-w-none">
                <p>{String(item.description)}</p>
              </div>
            ) : null}
          </div>
        </div>

        {flavorProfile && Object.keys(flavorProfile).length > 0 && (
          <div className="border-t border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-3">Вкусовой профиль</h2>
            <div className="space-y-2">
              {Object.entries(flavorProfile).map(([key, val]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-sm text-zinc-600 w-24 capitalize">{key}</span>
                  <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(val) || 0))}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 w-8">{Number(val) || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {item.history ? (
          <div className="border-t border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-2">История</h2>
            <p className="text-zinc-700 text-sm">{String(item.history)}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
