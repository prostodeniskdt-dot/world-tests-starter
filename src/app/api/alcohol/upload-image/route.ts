import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { requireAuth } from "@/lib/auth-middleware";
import { uploadToS3, isS3Configured } from "@/lib/s3";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_DIMENSION = 2560;

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  if (!isS3Configured()) {
    return NextResponse.json(
      { ok: false, error: "S3 не настроен. Добавьте переменные S3_* в окружение." },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Файл не передан" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { ok: false, error: "Файл слишком большой (макс. 10 МБ)" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: "Допустимые форматы: JPEG, PNG, WebP" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer()) as Buffer;
    let outBuf: Buffer = buffer;
    let contentType = file.type;
    let ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";

    try {
      const meta = await sharp(buffer).metadata();
      const w = meta.width ?? 0;
      const h = meta.height ?? 0;
      const maxDim = Math.max(w, h);
      if (maxDim > MAX_DIMENSION) {
        const resized = await sharp(buffer)
          .rotate()
          .resize(MAX_DIMENSION, MAX_DIMENSION, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 86 })
          .toBuffer();
        outBuf = Buffer.from(resized);
        contentType = "image/webp";
        ext = "webp";
      }
    } catch {
      return NextResponse.json(
        { ok: false, error: "Не удалось обработать изображение" },
        { status: 400 }
      );
    }

    const key = `alcohol/submissions/${auth.userId}/${randomUUID()}.${ext}`;
    const url = await uploadToS3(outBuf, key, contentType);
    if (!url) {
      return NextResponse.json(
        { ok: false, error: "Ошибка загрузки в хранилище" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, url, key });
  } catch (err) {
    console.error("Alcohol upload-image error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка сервера" }, { status: 500 });
  }
}
