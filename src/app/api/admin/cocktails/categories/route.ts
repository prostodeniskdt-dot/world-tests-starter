import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-middleware";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";

export async function GET(req: NextRequest) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  try {
    const { rows } = await db.query(
      "SELECT id, name, slug, sort_order FROM cocktail_categories ORDER BY sort_order, id"
    );
    return NextResponse.json({ ok: true, items: rows });
  } catch (err) {
    console.error("Admin cocktail categories list error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка" }, { status: 500 });
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

  const name = body.name ? String(body.name).trim() : "";
  if (!name) {
    return NextResponse.json({ ok: false, error: "Укажите название" }, { status: 400 });
  }

  const slug = slugify(name);
  const sortOrder = body.sort_order != null ? Number(body.sort_order) : 0;

  try {
    const { rows } = await db.query(
      "INSERT INTO cocktail_categories (name, slug, sort_order) VALUES ($1, $2, $3) RETURNING id",
      [name, slug, sortOrder]
    );
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error("Admin create cocktail category error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка создания" }, { status: 500 });
  }
}
