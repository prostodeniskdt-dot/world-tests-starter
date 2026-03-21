import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-middleware";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  try {
    const { rows } = await db.query(
      `SELECT id, name, slug, sort_order, created_at FROM knowledge_categories ORDER BY sort_order ASC, id ASC`
    );
    return NextResponse.json({ ok: true, items: rows });
  } catch (err) {
    console.error("Admin categories GET error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    let slug = String(body?.slug || "").trim().toLowerCase();
    const sortOrder = Math.max(0, parseInt(String(body?.sort_order ?? "0"), 10) || 0);

    if (!name) {
      return NextResponse.json({ ok: false, error: "Укажите название" }, { status: 400 });
    }

    if (!slug) {
      slug = name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\u0400-\u04ff-]+/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    }
    if (!slug) {
      return NextResponse.json({ ok: false, error: "Укажите slug (латиница, цифры, дефис)" }, { status: 400 });
    }

    await db.query(
      `INSERT INTO knowledge_categories (name, slug, sort_order) VALUES ($1, $2, $3)`,
      [name, slug, sortOrder]
    );
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const code = err && typeof err === "object" && "code" in err ? String((err as { code: string }).code) : "";
    if (code === "23505") {
      return NextResponse.json({ ok: false, error: "Категория с таким slug уже есть" }, { status: 409 });
    }
    console.error("Admin categories POST error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка сохранения" }, { status: 500 });
  }
}
