import "server-only";
import sharp from "sharp";

export type ImageValidationOptions = {
  maxBytes: number;
  maxWidth?: number;
  maxHeight?: number;
  maxDimension?: number;
  resizeToMaxDimension?: number;
  outputWebpQuality?: number;
};

export type ValidatedImage = {
  buffer: Buffer;
  contentType: string;
  ext: string;
};

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function validateImageUpload(
  file: File,
  allowedTypes: string[],
  options: ImageValidationOptions
): Promise<{ ok: true; image: ValidatedImage } | { ok: false; error: string }> {
  if (!allowedTypes.includes(file.type)) {
    return { ok: false, error: "Недопустимый формат изображения" };
  }

  if (file.size > options.maxBytes) {
    return { ok: false, error: "Файл слишком большой" };
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());

  try {
    const meta = await sharp(inputBuffer).metadata();
    if (!meta.width || !meta.height) {
      return { ok: false, error: "Файл не является изображением" };
    }

    const maxW = options.maxWidth ?? options.maxDimension ?? 4000;
    const maxH = options.maxHeight ?? options.maxDimension ?? 4000;
    if (meta.width > maxW || meta.height > maxH) {
      return { ok: false, error: "Изображение слишком большое" };
    }

    let buffer: Buffer = inputBuffer;
    let contentType = file.type;
    let ext = MIME_TO_EXT[file.type] ?? "jpg";

    const resizeTo = options.resizeToMaxDimension;
    if (resizeTo) {
      const maxDim = Math.max(meta.width, meta.height);
      if (maxDim > resizeTo) {
        const resized = await sharp(inputBuffer)
          .rotate()
          .resize(resizeTo, resizeTo, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: options.outputWebpQuality ?? 86 })
          .toBuffer();
        buffer = Buffer.from(resized);
        contentType = "image/webp";
        ext = "webp";
      }
    }

    return { ok: true, image: { buffer, contentType, ext } };
  } catch {
    return { ok: false, error: "Не удалось обработать изображение" };
  }
}
