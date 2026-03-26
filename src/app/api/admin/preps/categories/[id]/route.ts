import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-middleware";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) return NextResponse.json({ ok: false, error: "Неверный ID" }, { status: 400 });

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
    const { rowCount } = await db.query(
      `UPDATE prep_categories SET name=$1, slug=$2, sort_order=$3 WHERE id=$4`,
      [name, slug, sort_order, numId]
    );
    if (!rowCount) return NextResponse.json({ ok: false, error: "Не найдено" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin update prep category error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка обновления" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) return NextResponse.json({ ok: false, error: "Неверный ID" }, { status: 400 });

  try {
    const { rowCount } = await db.query(`DELETE FROM prep_categories WHERE id = $1`, [numId]);
    if (!rowCount) return NextResponse.json({ ok: false, error: "Не найдено" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin delete prep category error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка удаления" }, { status: 500 });
  }
}

