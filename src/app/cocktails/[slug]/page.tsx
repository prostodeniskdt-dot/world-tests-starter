import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Martini, ArrowLeft } from "lucide-react";

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
  const item = rows[0] as Record<string, unknown>;
  const ingredients = item.ingredients as { name: string; amount: string }[] | null;
  const flavorProfile = item.flavor_profile as Record<string, number> | null;
  const tags = item.tags as string[] | null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/cocktails"
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Коктейли
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
              <Martini className="h-24 w-24 text-zinc-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-zinc-900">{String(item.name)}</h1>
              {item.is_classic ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                  Классика
                </span>
              ) : null}
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
          <div className="border-t border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-3">Рецепт</h2>
            <ul className="space-y-1">
              {ingredients.map((ing, i) => (
                <li key={i} className="text-zinc-700">
                  {String(ing?.amount ?? "")} {String(ing?.name ?? "")}
                </li>
              ))}
            </ul>
          </div>
        )}

        {item.instructions ? (
          <div className="border-t border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-2">Приготовление</h2>
            <p className="text-zinc-700 text-sm whitespace-pre-wrap">
              {String(item.instructions)}
            </p>
          </div>
        ) : null}

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
                </div>
              ))}
            </div>
          </div>
        )}

        {(item.author != null || item.bar_name != null) ? (
          <div className="border-t border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-2">Автор и бар</h2>
            <p className="text-zinc-700 text-sm">
              {[item.bar_name, item.bar_city, item.author].filter(Boolean).map(String).join(" • ")}
            </p>
          </div>
        ) : null}

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
      </div>
    </div>
  );
}
