import { redirect } from "next/navigation";
import { db } from "@/lib/db";

function safeDecodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Старые ссылки /technique/:slug вели на карточку оборудования.
 */
export default async function LegacyTechniqueSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = safeDecodeSlug(rawSlug);
  try {
    const { rows } = await db.query(
      `SELECT 1 FROM equipment WHERE slug = $1 AND is_published = true LIMIT 1`,
      [slug]
    );
    if (rows.length > 0) {
      redirect(`/technique/equipment/${encodeURIComponent(slug)}`);
    }
  } catch {
    /* not found */
  }
  redirect("/technique/equipment");
}
