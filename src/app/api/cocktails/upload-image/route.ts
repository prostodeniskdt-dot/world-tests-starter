import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { requireAuth } from "@/lib/auth-middleware";
import { uploadToS3, isS3Configured } from "@/lib/s3";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_DIMENSION = 2560;

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  const mark = () => Date.now();

  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  if (!isS3Configured()) {
    return NextResponse.json(
      { ok: false, error: "S3 не настроен. Добавьте переменные S3_* в окружение." },
      { status: 503 }
    );
  }

  try {
    const tAuth = mark();
    const formData = await req.formData();
    const tForm = mark();
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
    const tRead = mark();
    let outBuf: Buffer = buffer;
    let contentType = file.type;
    let ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    let metaW = 0;
    let metaH = 0;
    let didResize = false;

    try {
      const meta = await sharp(buffer).metadata();
      const w = meta.width ?? 0;
      const h = meta.height ?? 0;
      metaW = w;
      metaH = h;
      const maxDim = Math.max(w, h);
      if (maxDim > MAX_DIMENSION) {
        didResize = true;
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
    const tSharp = mark();

    const key = `cocktails/submissions/${auth.userId}/${randomUUID()}.${ext}`;
    const url = await uploadToS3(outBuf, key, contentType);
    const tS3 = mark();
    if (!url) {
      return NextResponse.json(
        { ok: false, error: "Ошибка загрузки в хранилище" },
        { status: 500 }
      );
    }

    const timing = {
      totalMs: tS3 - t0,
      authMs: tAuth - t0,
      formDataMs: tForm - tAuth,
      readMs: tRead - tForm,
      sharpMs: tSharp - tRead,
      s3Ms: tS3 - tSharp,
    };

    console.info("cocktails/upload-image", {
      fileSize: file.size,
      fileType: file.type,
      metaW,
      metaH,
      didResize,
      outSize: outBuf.byteLength,
      contentType,
      ext,
      ...timing,
    });

    return NextResponse.json(
      { ok: true, url, key, timing },
      {
        headers: {
          "x-upload-total-ms": String(timing.totalMs),
          "x-upload-s3-ms": String(timing.s3Ms),
          "x-upload-sharp-ms": String(timing.sharpMs),
        },
      }
    );
  } catch (err) {
    console.error("Cocktails upload-image error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка сервера" }, { status: 500 });
  }
}
