import { NA_CATEGORY_CONFIG, type NaFieldDef } from "@/lib/naCategoryConfig";

export function labelForCategorySpecificValue(field: NaFieldDef, value: unknown): string {
  if (value == null) return "";
  if (field.type === "boolean") return value === true ? "Да" : value === false ? "Нет" : String(value);
  if (field.type === "select" && field.options) {
    const s = String(value);
    const o = field.options.find((x) => x.value === s);
    return o?.label ?? s;
  }
  return String(value);
}

export function formatCategorySpecificForDisplay(
  categorySlug: string | null | undefined,
  raw: unknown
): { label: string; value: string }[] {
  if (!categorySlug || !raw || typeof raw !== "object") return [];
  const cfg = NA_CATEGORY_CONFIG[categorySlug];
  if (!cfg?.fields.length) return [];
  const o = raw as Record<string, unknown>;
  const out: { label: string; value: string }[] = [];
  for (const field of cfg.fields) {
    const v = o[field.key];
    if (v == null || v === "") continue;
    out.push({
      label: field.label,
      value: labelForCategorySpecificValue(field, v),
    });
  }
  return out;
}
