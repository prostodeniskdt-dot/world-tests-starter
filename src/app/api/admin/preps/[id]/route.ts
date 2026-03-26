import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-middleware";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) {
    return NextResponse.json({ ok: false, error: "Неверный ID" }, { status: 400 });
  }

  try {
    const { rows } = await db.query("SELECT * FROM preps WHERE id = $1", [numId]);
    if (rows.length === 0) return NextResponse.json({ ok: false, error: "Не найдено" }, { status: 404 });
    return NextResponse.json({ ok: true, item: rows[0] });
  } catch (err) {
    console.error("Admin get prep error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) {
    return NextResponse.json({ ok: false, error: "Неверный ID" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный JSON" }, { status: 400 });
  }

  const name = body.name != null ? String(body.name).trim() : "";
  if (!name) return NextResponse.json({ ok: false, error: "Укажите название" }, { status: 400 });

  const ingredientsJson = JSON.stringify(Array.isArray(body.ingredients) ? body.ingredients : []);
  const socialJson = JSON.stringify(
    body.social_links && typeof body.social_links === "object" ? body.social_links : {}
  );
  const tags = Array.isArray(body.tags) ? body.tags.map(String) : [];

  try {
    const { rowCount } = await db.query(
      `UPDATE preps SET
        name=$1, slug=$2, category_id=$3, composition=$4,
        ingredients=$5::jsonb, tags=$6, image_url=$7,
        author=$8, bar_name=$9, bar_city=$10, bar_description=$11, social_links=$12::jsonb,
        is_published=$13, updated_at=now()
       WHERE id=$14`,
      [
        name,
        body.slug ? String(body.slug).trim() : undefined,
        body.category_id != null && body.category_id !== "" ? Number(body.category_id) : null,
        body.composition || null,
        ingredientsJson,
        tags,
        body.image_url || null,
        body.author || null,
        body.bar_name || null,
        body.bar_city || null,
        body.bar_description || null,
        socialJson,
        body.is_published !== false && body.is_published !== "false",
        numId,
      ]
    );
    if (!rowCount) return NextResponse.json({ ok: false, error: "Не найдено" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin update prep error:", err);
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
  if (Number.isNaN(numId)) {
    return NextResponse.json({ ok: false, error: "Неверный ID" }, { status: 400 });
  }

  try {
    const { rowCount } = await db.query("DELETE FROM preps WHERE id = $1", [numId]);
    if (!rowCount) return NextResponse.json({ ok: false, error: "Не найдено" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin delete prep error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка удаления" }, { status: 500 });
  }
}

