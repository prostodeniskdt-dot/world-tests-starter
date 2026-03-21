import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { checkRateLimit, submitRateLimiterByUser } from "@/lib/rateLimit";
import { trimText } from "@/lib/techniquePayloadHelpers";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const rl = await checkRateLimit(submitRateLimiterByUser, auth.userId);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Слишком много отправок. Подождите минуту." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Тело не JSON" }, { status: 400 });
  }

  const slug = String(body.equipment_slug ?? body.equipmentSlug ?? "").trim();
  if (!slug) {
    return NextResponse.json({ ok: false, error: "Укажите equipment_slug" }, { status: 400 });
  }

  const rating = parseInt(String(body.rating ?? ""), 10);
  if (Number.isNaN(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ ok: false, error: "Оценка от 1 до 5" }, { status: 400 });
  }

  const review_text = trimText(body.review_text ?? body.reviewText, 8000);
  const usage_duration = trimText(body.usage_duration ?? body.usageDuration, 200);

  try {
    const eq = await db.query(
      `SELECT id FROM equipment WHERE slug = $1 AND is_published = true LIMIT 1`,
      [slug]
    );
    if (eq.rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Карточка оборудования не найдена" }, { status: 404 });
    }
    const equipmentId = (eq.rows[0] as { id: number }).id;

    await db.query(
      `INSERT INTO equipment_reviews (equipment_id, user_id, rating, review_text, usage_duration, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [equipmentId, auth.userId, rating, review_text, usage_duration]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Equipment review submit error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка сохранения" }, { status: 500 });
  }
}
