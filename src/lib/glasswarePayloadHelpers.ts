export {
  trimText,
  normalizeSlugInput,
  normalizeTags,
  normalizeGalleryUrls,
  normalizePurchaseLinks,
  normalizePriceSegment,
  EQUIPMENT_PRICE_SEGMENTS,
} from "@/lib/techniquePayloadHelpers";

/** Оценка 1–5 для практичности, эстетики, долговечности */
export function normalizeScore1to5(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const n = parseInt(String(raw), 10);
  if (Number.isNaN(n) || n < 1 || n > 5) return null;
  return n;
}
