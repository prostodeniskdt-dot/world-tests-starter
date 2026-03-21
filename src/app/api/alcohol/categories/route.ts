import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const { rows } = await db.query(
      `SELECT id, name, slug FROM alcohol_categories ORDER BY sort_order ASC, id ASC`
    );
    return NextResponse.json({ ok: true, items: rows });
  } catch (err) {
    console.error("Alcohol categories error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка загрузки", items: [] }, { status: 500 });
  }
}
