import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-middleware";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";

export async function GET(req: NextRequest) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  try {
    const { rows } = await db.query(
      `SELECT id, name, slug, sort_order FROM prep_categories ORDER BY sort_order ASC, id ASC`
    );
    return NextResponse.json({ ok: true, items: rows });
  } catch (err) {
    console.error("Admin preps categories error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка загрузки", items: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный JSON" }, { status: 400 });
  }

  const name = body.name != null ? String(body.name).trim() : "";
  if (!name) return NextResponse.json({ ok: false, error: "Укажите название" }, { status: 400 });

  const sort_order = body.sort_order != null && body.sort_order !== "" ? Number(body.sort_order) : 0;
  const slug = slugify(name);

  try {
    await db.query(
      `INSERT INTO prep_categories (name, slug, sort_order) VALUES ($1, $2, $3)`,
      [name, slug, sort_order]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin create prep category error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка создания" }, { status: 500 });
  }
}

