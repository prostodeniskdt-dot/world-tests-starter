import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { isAllowedKnowledgeMediaUrl } from "@/lib/knowledgeMediaUrl";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Некорректный формат запроса" },
      { status: 400 }
    );
  }

  const glasswareIdRaw = body.glassware_id ?? body.glasswareId;
  const glasswareId = parseInt(String(glasswareIdRaw ?? ""), 10);
  if (Number.isNaN(glasswareId) || glasswareId < 1) {
    return NextResponse.json({ ok: false, error: "Укажите карточку посуды" }, { status: 400 });
  }

  const imageUrl = body.image_url ?? body.imageUrl;
  const url = typeof imageUrl === "string" ? imageUrl.trim() : "";
  if (!url) {
    return NextResponse.json({ ok: false, error: "Укажите URL фото" }, { status: 400 });
  }
  if (!isAllowedKnowledgeMediaUrl(url)) {
    return NextResponse.json(
      { ok: false, error: "Разрешены только файлы, загруженные на сайт" },
      { status: 400 }
    );
  }

  const caption =
    typeof body.caption === "string"
      ? body.caption.trim().slice(0, 1000)
      : null;

  try {
    const check = await db.query(
      `SELECT id FROM glassware WHERE id = $1 AND is_published = true`,
      [glasswareId]
    );
    if (check.rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Карточка посуды не найдена" },
        { status: 404 }
      );
    }

    await db.query(
      `INSERT INTO glassware_drink_photos (glassware_id, user_id, image_url, caption, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [glasswareId, auth.userId, url, caption]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Glassware drink photo submit error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка сохранения" }, { status: 500 });
  }
}
