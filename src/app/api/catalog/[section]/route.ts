import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DRINK_TYPES } from "@/lib/alcoholDrinkTypes";

const SECTIONS = ["alcohol", "na", "technique", "skills", "cocktails", "glassware"] as const;
type Section = (typeof SECTIONS)[number];

const TABLE_MAP: Record<Section, { table: string; listColumns: string }> = {
  alcohol: {
    table: "alcohol_products",
    listColumns:
      "id, name, slug, image_url, category_id, drink_type, abv, country, region, producer, description",
  },
  na: {
    table: "na_products",
    listColumns:
      "id, name, slug, image_url, category_id, tags, subcategory_text, description, producer, country",
  },
  technique: {
    table: "equipment",
    listColumns:
      "id, name, slug, image_url, category_id, producer, price_segment, tags, description",
  },
  skills: {
    table: "technique_guides",
    listColumns: "id, name, slug, category_id, difficulty, short_description, tags",
  },
  cocktails: {
    table: "cocktails",
    listColumns: "id, name, slug, image_url, category_id, is_classic, description",
  },
  glassware: {
    table: "glassware",
    listColumns:
      "id, name, slug, image_url, category_id, subcategory_text, producer, price_segment, tags, description",
  },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ section: string }> }
) {
  const { section } = await params;
  if (!SECTIONS.includes(section as Section)) {
    return NextResponse.json({ ok: false, error: "Неизвестный раздел" }, { status: 400 });
  }

  const { table, listColumns } = TABLE_MAP[section as Section];
  const searchParams = req.nextUrl.searchParams;
  const categoryId = searchParams.get("category");
  const search = searchParams.get("q")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

  try {
    let where = " WHERE is_published = true";
    const values: unknown[] = [];
    let i = 1;

    if (categoryId) {
      where += ` AND category_id = $${i}`;
      values.push(parseInt(categoryId, 10));
      i++;
    }

    if (search) {
      where += ` AND (name ILIKE $${i} OR slug ILIKE $${i})`;
      values.push(`%${search}%`);
      i++;
    }

    const classic = searchParams.get("classic");
    if (section === "cocktails" && classic === "true") {
      where += ` AND is_classic = true`;
    }
    if (section === "cocktails" && classic === "false") {
      where += ` AND is_classic = false`;
    }

    const drinkTypeParam = searchParams.get("drink_type")?.trim();
    if (section === "alcohol" && drinkTypeParam) {
      const dt = (DRINK_TYPES as readonly string[]).includes(drinkTypeParam) ? drinkTypeParam : null;
      if (dt) {
        where += ` AND drink_type = $${i}`;
        values.push(dt);
        i++;
      }
    }

    const tagParam = searchParams.get("tag")?.trim().toLowerCase();
    if (
      (section === "na" || section === "technique" || section === "skills" || section === "glassware") &&
      tagParam &&
      tagParam.length <= 64
    ) {
      where += ` AND $${i} = ANY(tags)`;
      values.push(tagParam);
      i++;
    }

    const countValues = [...values];
    values.push(limit, offset);
    const limitIdx = i;
    const offsetIdx = i + 1;

    const [rowsResult, countResult] = await Promise.all([
      db.query(
        `SELECT ${listColumns} FROM ${table}${where} ORDER BY name ASC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        values
      ),
      db.query(
        `SELECT COUNT(*) AS c FROM ${table}${where}`,
        countValues
      ),
    ]);

    const total = parseInt((countResult.rows[0] as { c: string })?.c || "0", 10);

    return NextResponse.json({
      ok: true,
      items: rowsResult.rows,
      total,
      limit,
      offset,
    });
  } catch (err) {
    console.error(`Catalog ${section} list error:`, err);
    return NextResponse.json(
      { ok: false, error: "Ошибка загрузки" },
      { status: 500 }
    );
  }
}
