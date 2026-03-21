import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { rows } = await db.query(
      `SELECT id, name, slug, sort_order FROM knowledge_categories ORDER BY sort_order ASC, id ASC`
    );
    return NextResponse.json({ ok: true, items: rows });
  } catch (err) {
    console.error("Knowledge categories list error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка загрузки" }, { status: 500 });
  }
}
