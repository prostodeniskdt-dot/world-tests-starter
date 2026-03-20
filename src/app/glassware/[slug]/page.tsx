import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { UtensilsCrossed, ArrowLeft } from "lucide-react";

export default async function GlasswareProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { rows } = await db.query(
    "SELECT * FROM glassware WHERE slug = $1 AND is_published = true",
    [slug]
  );

  if (rows.length === 0) notFound();
  const item = rows[0] as Record<string, unknown>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/glassware"
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Посуда
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
              <UtensilsCrossed className="h-24 w-24 text-zinc-300" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">{String(item.name)}</h1>
            {item.description ? (
              <div className="prose prose-sm text-zinc-700 max-w-none">
                <p>{String(item.description)}</p>
              </div>
            ) : null}
            {(item.volume != null || item.dimensions != null) ? (
              <div className="mt-4 text-sm text-zinc-600 space-y-1">
                {item.volume != null ? <p>Объём: {String(item.volume)}</p> : null}
                {item.dimensions != null ? <p>Размеры: {String(item.dimensions)}</p> : null}
              </div>
            ) : null}
          </div>
        </div>

        {item.usage ? (
          <div className="border-t border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-2">Применение</h2>
            <p className="text-zinc-700 text-sm">{String(item.usage)}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
