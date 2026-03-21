import "server-only";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

function getS3Config() {
  const accessKey = process.env.S3_ACCESS_KEY;
  const secretKey = process.env.S3_SECRET_KEY;
  const bucket = process.env.S3_BUCKET;
  const endpoint = process.env.S3_ENDPOINT || "https://s3.twcstorage.ru";
  const region = process.env.S3_REGION || "ru-1";
  const publicUrl = process.env.S3_PUBLIC_URL; // e.g. https://bucket.s3.twcstorage.ru or custom domain

  if (!accessKey || !secretKey || !bucket) {
    return null;
  }

  return {
    client: new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      forcePathStyle: true,
    }),
    bucket,
    publicUrl: publicUrl || `${endpoint.replace("https://", `https://${bucket}.`)}`,
  };
}

export async function uploadToS3(
  file: Buffer,
  key: string,
  contentType: string
): Promise<string | null> {
  const config = getS3Config();
  if (!config) return null;

  try {
    await config.client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
      })
    );
    // Формируем публичный URL (Timeweb: https://bucket.s3.twcstorage.ru/key)
    const base = config.publicUrl.replace(/\/$/, "");
    const normalizedKey = key.startsWith("/") ? key.slice(1) : key;
    return `${base}/${normalizedKey}`;
  } catch (err) {
    console.error("S3 upload error:", err);
    return null;
  }
}

export async function deleteFromS3(key: string): Promise<boolean> {
  const config = getS3Config();
  if (!config) return false;

  try {
    await config.client.send(
      new DeleteObjectCommand({ Bucket: config.bucket, Key: key })
    );
    return true;
  } catch (err) {
    console.error("S3 delete error:", err);
    return false;
  }
}

export function isS3Configured(): boolean {
  return !!(
    process.env.S3_ACCESS_KEY &&
    process.env.S3_SECRET_KEY &&
    process.env.S3_BUCKET
  );
}

/** Префиксы публичных URL объектов (для проверки src в HTML и обложек). */
export function getS3PublicUrlPrefixes(): string[] {
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

/** Извлекает ключ объекта в бакете из публичного URL (для удаления при смене аватара/обоев). */
export function tryGetS3KeyFromPublicUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const normalized = url.trim();
  for (const prefix of getS3PublicUrlPrefixes()) {
    if (normalized.startsWith(prefix + "/")) {
      return normalized.slice(prefix.length + 1);
    }
  }
  return null;
}
