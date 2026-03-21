import sanitizeHtml from "sanitize-html";
import { slugify } from "@/lib/slugify";
import { isAllowedKnowledgeMediaUrl } from "@/lib/knowledgeMediaUrl";

export const EQUIPMENT_PRICE_SEGMENTS = ["budget", "mid", "premium", "pro"] as const;
export type EquipmentPriceSegment = (typeof EQUIPMENT_PRICE_SEGMENTS)[number];

export const GUIDE_DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export type GuideDifficulty = (typeof GUIDE_DIFFICULTIES)[number];

export function trimText(v: unknown, max: number): string | null {
  const s = v != null ? String(v).trim() : "";
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

export function normalizeSlugInput(raw: unknown): string {
  const s = raw != null ? String(raw).trim() : "";
  if (!s) return "";
  return slugify(s).slice(0, 120);
}

export function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const t of raw) {
    const s = sanitizeHtml(String(t ?? "").trim(), { allowedTags: [], allowedAttributes: {} });
    if (s && out.length < 24) out.push(s.slice(0, 48).toLowerCase());
  }
  return [...new Set(out)];
}

export function normalizeGalleryUrls(raw: unknown, max = 12): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const u of raw) {
    const url = String(u ?? "").trim();
    if (!url || !isAllowedKnowledgeMediaUrl(url)) continue;
    out.push(url);
    if (out.length >= max) break;
  }
  return out;
}

export type KeySpecPair = { name: string; value: string };

export function normalizeKeySpecs(raw: unknown): KeySpecPair[] {
  if (!Array.isArray(raw)) return [];
  const out: KeySpecPair[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const name = sanitizeHtml(String(o.name ?? "").trim(), { allowedTags: [], allowedAttributes: {} }).slice(
      0,
      120
    );
    const value = sanitizeHtml(String(o.value ?? "").trim(), { allowedTags: [], allowedAttributes: {} }).slice(
      0,
      500
    );
    if (!name) continue;
    out.push({ name, value });
    if (out.length >= 40) break;
  }
  return out;
}

export type PurchaseLink = { label: string; url: string };

export function normalizePurchaseLinks(raw: unknown): PurchaseLink[] {
  if (!Array.isArray(raw)) return [];
  const out: PurchaseLink[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const label = sanitizeHtml(String(o.label ?? "").trim(), { allowedTags: [], allowedAttributes: {} }).slice(
      0,
      120
    );
    let url = String(o.url ?? "").trim().slice(0, 2000);
    if (!url.startsWith("http://") && !url.startsWith("https://")) continue;
    if (!label) url = url.slice(0, 80);
    out.push({ label: label || "Ссылка", url });
    if (out.length >= 12) break;
  }
  return out;
}

export function normalizePriceSegment(raw: unknown): string | null {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return null;
  return (EQUIPMENT_PRICE_SEGMENTS as readonly string[]).includes(s) ? s : null;
}

export function normalizeDifficulty(raw: unknown): string | null {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return null;
  return (GUIDE_DIFFICULTIES as readonly string[]).includes(s) ? s : null;
}

export function normalizeSlugArray(raw: unknown, max = 24): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const x of raw) {
    const s = sanitizeHtml(String(x ?? "").trim(), { allowedTags: [], allowedAttributes: {} }).slice(0, 120);
    if (s) out.push(s);
    if (out.length >= max) break;
  }
  return [...new Set(out)];
}

/** Простая проверка внешнего URL для видео */
export function normalizeVideoUrl(raw: unknown): string | null {
  const s = String(raw ?? "").trim().slice(0, 2000);
  if (!s) return null;
  if (!s.startsWith("https://") && !s.startsWith("http://")) return null;
  try {
    const u = new URL(s);
    const h = u.hostname.toLowerCase();
    if (
      h.includes("youtube.com") ||
      h === "youtu.be" ||
      h.includes("vimeo.com") ||
      h.includes("vk.com") ||
      h.includes("rutube.ru")
    ) {
      return s;
    }
  } catch {
    return null;
  }
  return null;
}
