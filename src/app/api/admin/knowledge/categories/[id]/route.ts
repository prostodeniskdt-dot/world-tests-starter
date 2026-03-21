import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-middleware";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await params;
  const catId = parseInt(id, 10);
  if (Number.isNaN(catId)) {
    return NextResponse.json({ ok: false, error: "Неверный ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const name = body?.name != null ? String(body.name).trim() : undefined;
    const slugRaw = body?.slug != null ? String(body.slug).trim().toLowerCase() : undefined;
    const sortOrderRaw = body?.sort_order;

    const updates: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (name !== undefined) {
      if (!name) {
        return NextResponse.json({ ok: false, error: "Пустое название" }, { status: 400 });
      }
      updates.push(`name = $${i++}`);
      values.push(name);
    }
    if (slugRaw !== undefined) {
      if (!slugRaw) {
        return NextResponse.json({ ok: false, error: "Пустой slug" }, { status: 400 });
      }
      updates.push(`slug = $${i++}`);
      values.push(slugRaw);
    }
    if (sortOrderRaw !== undefined) {
      const so = Math.max(0, parseInt(String(sortOrderRaw), 10) || 0);
      updates.push(`sort_order = $${i++}`);
      values.push(so);
    }

    if (updates.length === 0) {
      return NextResponse.json({ ok: false, error: "Нет полей для обновления" }, { status: 400 });
    }

    values.push(catId);
    const r = await db.query(
      `UPDATE knowledge_categories SET ${updates.join(", ")} WHERE id = $${i} RETURNING id`,
      values
    );
    if (r.rowCount === 0) {
      return NextResponse.json({ ok: false, error: "Не найдено" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const code = err && typeof err === "object" && "code" in err ? String((err as { code: string }).code) : "";
    if (code === "23505") {
      return NextResponse.json({ ok: false, error: "Категория с таким slug уже есть" }, { status: 409 });
    }
    console.error("Admin categories PATCH error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await params;
  const catId = parseInt(id, 10);
  if (Number.isNaN(catId)) {
    return NextResponse.json({ ok: false, error: "Неверный ID" }, { status: 400 });
  }

  try {
    const r = await db.query(`DELETE FROM knowledge_categories WHERE id = $1`, [catId]);
    if (r.rowCount === 0) {
      return NextResponse.json({ ok: false, error: "Не найдено" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin categories DELETE error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка" }, { status: 500 });
  }
}
