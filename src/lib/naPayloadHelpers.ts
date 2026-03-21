import sanitizeHtml from "sanitize-html";
import { slugify } from "@/lib/slugify";
import { NA_CATEGORY_CONFIG, type NaFieldDef } from "@/lib/naCategoryConfig";

export function trimText(v: unknown, max: number): string | null {
  const s = v != null ? String(v).trim() : "";
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

export function normalizeNaFlavorProfile(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(o)) {
    const key = k.slice(0, 48);
    if (!key) continue;
    const n = Number(v);
    if (Number.isFinite(n)) out[key] = Math.min(100, Math.max(0, Math.round(n)));
    if (Object.keys(out).length >= 20) break;
  }
  return out;
}

export function normalizeNaTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const t of raw) {
    const s = sanitizeHtml(String(t ?? "").trim(), { allowedTags: [], allowedAttributes: {} });
    if (s && out.length < 24) out.push(s.slice(0, 48).toLowerCase());
  }
  return [...new Set(out)];
}

function parseBoolean(v: unknown): boolean | null {
  if (v === true || v === "true" || v === "1" || v === "yes" || v === "on") return true;
  if (v === false || v === "false" || v === "0" || v === "no") return false;
  return null;
}

function normalizeFieldValue(def: NaFieldDef, raw: unknown): unknown {
  if (raw == null || raw === "") return undefined;
  switch (def.type) {
    case "text": {
      const s = sanitizeHtml(String(raw).trim(), { allowedTags: [], allowedAttributes: {} });
      const max = def.maxLen ?? 2000;
      return s ? s.slice(0, max) : undefined;
    }
    case "number": {
      const n = parseFloat(String(raw).replace(",", "."));
      if (Number.isNaN(n)) return undefined;
      return Math.round(n * 1000) / 1000;
    }
    case "boolean": {
      const b = parseBoolean(raw);
      return b === null ? undefined : b;
    }
    case "select": {
      const s = String(raw).trim().slice(0, 64);
      const allowed = new Set((def.options ?? []).map((o) => o.value));
      if (!s || !allowed.has(s)) return undefined;
      return s;
    }
    default:
      return undefined;
  }
}

/**
 * Собирает category_specific и category_extra из тела заявки.
 * specific берётся из body.category_specific (object) или плоских полей.
 */
export function buildNaCategoryPayload(
  categorySlug: string,
  body: Record<string, unknown>
): { category_specific: Record<string, unknown>; category_extra: Record<string, unknown> } {
  const cfg = NA_CATEGORY_CONFIG[categorySlug];
  const specific: Record<string, unknown> = {};
  const extra: Record<string, unknown> = {};

  const nested =
    body.category_specific != null && typeof body.category_specific === "object"
      ? (body.category_specific as Record<string, unknown>)
      : {};

  if (cfg?.extraOnly) {
    if (body.category_extra != null && typeof body.category_extra === "object") {
      const o = body.category_extra as Record<string, unknown>;
      for (const [k, v] of Object.entries(o)) {
        const key = k.slice(0, 64).replace(/[^\w-]/g, "");
        if (!key) continue;
        if (typeof v === "string") {
          const t = trimText(v, 4000);
          if (t) extra[key] = t;
        } else if (typeof v === "number" && Number.isFinite(v)) {
          extra[key] = v;
        } else if (typeof v === "boolean") {
          extra[key] = v;
        }
        if (Object.keys(extra).length >= 24) break;
      }
    }
    const notes = trimText(body.extra_notes ?? body.category_extra_notes, 8000);
    if (notes) extra.notes = notes;
    return { category_specific: {}, category_extra: extra };
  }

  if (cfg?.fields) {
    for (const field of cfg.fields) {
      const raw = nested[field.key];
      const val = normalizeFieldValue(field, raw);
      if (val !== undefined) specific[field.key] = val;
    }
  }

  const extraNotes = trimText(body.extra_notes, 4000);
  if (extraNotes) extra.notes = extraNotes;

  if (body.category_extra != null && typeof body.category_extra === "object") {
    const o = body.category_extra as Record<string, unknown>;
    for (const [k, v] of Object.entries(o)) {
      const key = k.slice(0, 64).replace(/[^\w-]/g, "");
      if (!key || key === "notes") continue;
      if (typeof v === "string") {
        const t = trimText(v, 2000);
        if (t) extra[key] = t;
      }
      if (Object.keys(extra).length >= 20) break;
    }
  }

  return { category_specific: specific, category_extra: extra };
}

export function normalizeNaSlugInput(raw: unknown): string {
  const s = raw != null ? String(raw).trim() : "";
  if (!s) return "";
  return slugify(s).slice(0, 120);
}

export function parseAmountNumeric(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = parseFloat(String(v).replace(",", "."));
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 10000) / 10000;
}
