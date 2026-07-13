import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import {
  uploadToS3,
  isS3Configured,
  deleteFromS3,
  tryGetS3KeyFromPublicUrl,
} from "@/lib/s3";
import { validateImageUpload } from "@/lib/validateImageUpload";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_AVATAR = 2 * 1024 * 1024;
const MAX_COVER = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  if (!isS3Configured()) {
    return NextResponse.json(
      { ok: false, error: "S3 не настроен. Добавьте S3_* переменные окружения." },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Неверное тело запроса" }, { status: 400 });
  }

  const kind = formData.get("kind");
  if (kind !== "avatar" && kind !== "cover") {
    return NextResponse.json({ ok: false, error: "Укажите kind: avatar или cover" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Файл не передан" }, { status: 400 });
  }

  const maxSize = kind === "avatar" ? MAX_AVATAR : MAX_COVER;
  const validated = await validateImageUpload(file, ALLOWED_TYPES, {
    maxBytes: maxSize,
    maxDimension: kind === "avatar" ? 2048 : 4000,
    resizeToMaxDimension: kind === "avatar" ? 512 : 1920,
  });
  if (!validated.ok) {
    return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
  }

  const { rows } = await db.query(
    `SELECT avatar_url, profile_cover_url FROM users WHERE id = $1 LIMIT 1`,
    [auth.userId]
  );
  const prev = rows[0];
  const oldUrl = kind === "avatar" ? prev?.avatar_url : prev?.profile_cover_url;
  const oldKey = oldUrl ? tryGetS3KeyFromPublicUrl(oldUrl) : null;
  if (oldKey) await deleteFromS3(oldKey);

  const { buffer, contentType, ext } = validated.image;
  const key = `profiles/${auth.userId}/${kind}-${randomUUID()}.${ext}`;
  const url = await uploadToS3(buffer, key, contentType);
  if (!url) {
    return NextResponse.json({ ok: false, error: "Ошибка загрузки в хранилище" }, { status: 500 });
  }

  if (kind === "avatar") {
    await db.query(`UPDATE users SET avatar_url = $1, updated_at = now() WHERE id = $2`, [
      url,
      auth.userId,
    ]);
  } else {
    await db.query(`UPDATE users SET profile_cover_url = $1, updated_at = now() WHERE id = $2`, [
      url,
      auth.userId,
    ]);
  }

  const { rows: fresh } = await db.query(
    `SELECT avatar_url, profile_cover_url FROM users WHERE id = $1 LIMIT 1`,
    [auth.userId]
  );

  return NextResponse.json({
    ok: true,
    avatarUrl: fresh[0]?.avatar_url ?? null,
    profileCoverUrl: fresh[0]?.profile_cover_url ?? null,
  });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const kind = new URL(req.url).searchParams.get("kind");
  if (kind !== "avatar" && kind !== "cover") {
    return NextResponse.json({ ok: false, error: "Query: kind=avatar или kind=cover" }, { status: 400 });
  }

  const { rows } = await db.query(
    `SELECT avatar_url, profile_cover_url FROM users WHERE id = $1 LIMIT 1`,
    [auth.userId]
  );
  const row = rows[0];
  const oldUrl = kind === "avatar" ? row?.avatar_url : row?.profile_cover_url;
  const oldKey = oldUrl ? tryGetS3KeyFromPublicUrl(oldUrl) : null;
  if (oldKey) await deleteFromS3(oldKey);

  if (kind === "avatar") {
    await db.query(`UPDATE users SET avatar_url = NULL, updated_at = now() WHERE id = $1`, [
      auth.userId,
    ]);
  } else {
    await db.query(`UPDATE users SET profile_cover_url = NULL, updated_at = now() WHERE id = $1`, [
      auth.userId,
    ]);
  }

  const { rows: fresh } = await db.query(
    `SELECT avatar_url, profile_cover_url FROM users WHERE id = $1 LIMIT 1`,
    [auth.userId]
  );

  return NextResponse.json({
    ok: true,
    avatarUrl: fresh[0]?.avatar_url ?? null,
    profileCoverUrl: fresh[0]?.profile_cover_url ?? null,
  });
}
