import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-middleware";
import { parseAndPreviewImport } from "@/lib/test-import/parse";

export async function POST(req: Request) {
  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof NextResponse) return adminCheck;

  let body: { text?: string; format?: "json" | "markdown" | "auto" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Невалидный JSON" }, { status: 400 });
  }

  const text = body.text ?? "";
  if (!text.trim()) {
    return NextResponse.json({ ok: false, error: "Пустой текст импорта" }, { status: 400 });
  }

  const preview = parseAndPreviewImport(text, body.format ?? "auto");
  return NextResponse.json({ ok: preview.ok, preview });
}
