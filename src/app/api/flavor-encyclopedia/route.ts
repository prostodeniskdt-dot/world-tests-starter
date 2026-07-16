import { NextRequest, NextResponse } from "next/server";
import {
  getEncyclopediaParts,
  getEncyclopediaPartBySlug,
  getEncyclopediaEntries,
  getSectionCountsForPart,
  type EncyclopediaSectionKey,
} from "@/lib/flavor-encyclopedia";

export const dynamic = "force-dynamic";

const VALID_SECTIONS: EncyclopediaSectionKey[] = [
  "drinks",
  "food",
  "desserts",
  "sauces",
  "universal",
  "other",
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      const parts = await getEncyclopediaParts();
      return NextResponse.json({ ok: true, parts });
    }

    const part = await getEncyclopediaPartBySlug(slug);
    if (!part) {
      return NextResponse.json(
        { ok: false, error: "Часть не найдена" },
        { status: 404 }
      );
    }

    const sectionParam = searchParams.get("section");
    const sectionKey =
      sectionParam && VALID_SECTIONS.includes(sectionParam as EncyclopediaSectionKey)
        ? (sectionParam as EncyclopediaSectionKey)
        : null;

    const query = searchParams.get("q");
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50)
    );
    const offset = Math.max(
      0,
      parseInt(searchParams.get("offset") ?? "0", 10) || 0
    );

    const [entriesResult, sectionCounts] = await Promise.all([
      getEncyclopediaEntries({
        partSlug: slug,
        sectionKey,
        query,
        limit,
        offset,
      }),
      getSectionCountsForPart(slug),
    ]);

    return NextResponse.json({
      ok: true,
      part,
      sectionCounts,
      ...entriesResult,
    });
  } catch (err) {
    console.error("flavor-encyclopedia API error:", err);
    return NextResponse.json(
      { ok: false, error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
