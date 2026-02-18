import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const DOC_MAP: Record<string, string> = {
  pdn: "Политика обработки персональных данных (152-ФЗ).txt",
  consent: "Согласие на обработку персональных данных.txt",
  distribution: "Согласие на распространение персональных данных.txt",
  agreement: "Пользовательское соглашение.txt",
  cookies: "Политика использования COOKIES и технических данных.txt",
  contacts: "Контактыреквизиты.txt",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const filename = DOC_MAP[slug];
  if (!filename) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  try {
    const filePath = path.join(process.cwd(), "doc", filename);
    const content = await readFile(filePath, "utf-8");
    return NextResponse.json({ ok: true, content });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "File not found or unreadable" },
      { status: 404 }
    );
  }
}
