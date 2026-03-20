import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const SECTIONS = ["alcohol", "na", "technique", "cocktails", "glassware"] as const;
type Section = (typeof SECTIONS)[number];

const TABLE_MAP: Record<Section, string> = {
  alcohol: "alcohol_products",
  na: "na_products",
  technique: "equipment",
  cocktails: "cocktails",
  glassware: "glassware",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ section: string; slug: string }> }
) {
  const { section, slug } = await params;
  if (!SECTIONS.includes(section as Section)) {
    return NextResponse.json({ ok: false, error: "Неизвестный раздел" }, { status: 400 });
  }

  const table = TABLE_MAP[section as Section];

  try {
    const { rows } = await db.query(
      `SELECT * FROM ${table} WHERE slug = $1 AND is_published = true`,
      [slug]
    );

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Не найдено" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, item: rows[0] });
  } catch (err) {
    console.error(`Catalog ${section} item error:`, err);
    return NextResponse.json(
      { ok: false, error: "Ошибка загрузки" },
      { status: 500 }
    );
  }
}
