import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import CocktailSlugPage from "@/app/cocktails/[slug]/page";
import { SITE_NAME } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) return { title: `Коктейль | ${SITE_NAME}` };
  try {
    const { rows } = await db.query(
      "SELECT name, description, image_url FROM cocktails WHERE id = $1 AND is_published = true",
      [numId]
    );
    if (rows.length === 0) return { title: `Коктейль | ${SITE_NAME}` };
    const item = rows[0] as Record<string, unknown>;
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

export default async function CocktailByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) notFound();

  const { rows } = await db.query(
    "SELECT slug FROM cocktails WHERE id = $1 AND is_published = true",
    [numId]
  );
  if (rows.length === 0) notFound();

  const slug = String((rows[0] as Record<string, unknown>).slug || "");
  // Reuse existing slug-based page implementation.
  return CocktailSlugPage({ params: Promise.resolve({ slug }) });
}

