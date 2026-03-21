/**
 * Проверка URL медиа для базы знаний / загрузок. Без server-only — может использоваться
 * в общих хелперах, попадающих в клиентский бандл (константы форм + нормализация).
 */

export function getS3PublicUrlPrefixes(): string[] {
  const explicit = (process.env.NEXT_PUBLIC_S3_PUBLIC_URL ?? process.env.S3_PUBLIC_URL)?.trim();
  if (explicit) {
    return [explicit.replace(/\/$/, "")];
  }
  const accessKey = process.env.S3_ACCESS_KEY;
  const secretKey = process.env.S3_SECRET_KEY;
  const bucket = process.env.S3_BUCKET;
  const endpoint = process.env.S3_ENDPOINT || "https://s3.twcstorage.ru";
  if (!accessKey || !secretKey || !bucket) return [];
  const publicUrl =
    process.env.S3_PUBLIC_URL ||
    `${endpoint.replace(/^https:\/\//, `https://${bucket}.`)}`;
  return [publicUrl.replace(/\/$/, "")];
}

export function normalizeKnowledgeMediaSrc(src: string): string {
  try {
    const u = new URL(src);
    return u.href;
  } catch {
    return "";
  }
}

export function isAllowedKnowledgeMediaUrl(url: string | null | undefined): boolean {
  if (url == null || url === "") return true;
  const trimmed = String(url).trim();
  if (!trimmed) return true;
  const prefixes = getS3PublicUrlPrefixes();
  if (prefixes.length === 0) return false;
  const normalized = normalizeKnowledgeMediaSrc(trimmed);
  if (!normalized.startsWith("https://")) return false;
  return prefixes.some((p) => normalized.startsWith(`${p}/`) || normalized === p);
}
