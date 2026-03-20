import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-middleware";
import { uploadToS3, isS3Configured } from "@/lib/s3";
import { randomUUID } from "crypto";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  if (!isS3Configured()) {
    return NextResponse.json(
      { ok: false, error: "S3 не настроен. Добавьте S3_* переменные окружения." },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const prefix = (formData.get("prefix") as string) || "uploads";

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Файл не передан" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { ok: false, error: "Файл слишком большой (макс. 5 МБ)" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: "Допустимые форматы: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() || "jpg";
    const key = `${prefix}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const url = await uploadToS3(buffer, key, file.type);
    if (!url) {
      return NextResponse.json(
        { ok: false, error: "Ошибка загрузки в хранилище" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, url, key });
  } catch (err) {
    console.error("Upload API error:", err);
    return NextResponse.json(
      { ok: false, error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
