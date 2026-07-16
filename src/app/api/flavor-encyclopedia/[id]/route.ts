import { NextRequest, NextResponse } from "next/server";
import { getEncyclopediaEntryById } from "@/lib/flavor-encyclopedia";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json(
        { ok: false, error: "Некорректный id" },
        { status: 400 }
      );
    }

    const entry = await getEncyclopediaEntryById(id);
    if (!entry) {
      return NextResponse.json(
        { ok: false, error: "Запись не найдена" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    console.error("flavor-encyclopedia entry API error:", err);
    return NextResponse.json(
      { ok: false, error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
