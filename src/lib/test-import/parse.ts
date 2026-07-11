import { normalizeTestImport } from "@/lib/test-import/normalize";
import { validateTestPayload, type ValidationIssue } from "@/lib/test-schema";

export type ImportPreviewResult = {
  ok: boolean;
  title?: string;
  questionCount?: number;
  mechanics?: Record<string, number>;
  mediaCount?: number;
  hintCount?: number;
  issues: ValidationIssue[];
  normalized?: Record<string, unknown>;
};

export function parseJsonImport(text: string): { data?: unknown; error?: string } {
  try {
    return { data: JSON.parse(text) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid JSON" };
  }
}

/** Детерминированный Markdown: YAML frontmatter + JSON-блок в ```json */
export function parseMarkdownImport(text: string): { data?: unknown; error?: string } {
  const trimmed = text.trim();
  if (!trimmed.startsWith("---")) {
    return { error: "Markdown-импорт требует YAML frontmatter (---)" };
  }
  const end = trimmed.indexOf("---", 3);
  if (end < 0) return { error: "Не закрыт YAML frontmatter" };

  const frontmatter = trimmed.slice(3, end).trim();
  const body = trimmed.slice(end + 3).trim();

  const meta: Record<string, unknown> = {};
  for (const line of frontmatter.split("\n")) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (m) {
      const key = m[1];
      let val: unknown = m[2].trim().replace(/^["']|["']$/g, "");
      if (val === "null") val = null;
      else if (/^\d+$/.test(String(val))) val = parseInt(String(val), 10);
      meta[key] = val;
    }
  }

  const jsonMatch = body.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      const block = JSON.parse(jsonMatch[1]);
      return {
        data: {
          schemaVersion: meta.schemaVersion ?? 1,
          title: meta.title ?? block.title,
          description: meta.description ?? block.description ?? "",
          category: meta.category ?? block.category ?? "",
          author: meta.author ?? block.author ?? "",
          difficultyLevel: meta.difficultyLevel ?? block.difficultyLevel ?? 1,
          basePoints: meta.basePoints ?? block.basePoints ?? 200,
          maxAttempts: meta.maxAttempts ?? block.maxAttempts ?? null,
          questions: block.questions ?? [],
          answerKey: block.answerKey ?? {},
        },
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Invalid JSON block" };
    }
  }

  return { error: "В Markdown нужен блок ```json с questions и answerKey" };
}

export function buildImportPreview(raw: unknown): ImportPreviewResult {
  if (!raw || typeof raw !== "object") {
    return {
      ok: false,
      issues: [{ code: "INVALID_INPUT", path: "root", message: "Ожидается объект", severity: "error" }],
    };
  }

  const { payload, warnings } = normalizeTestImport(raw as Record<string, unknown>);
  const validation = validateTestPayload(payload);

  const issues: ValidationIssue[] = [
    ...warnings.map((w) => ({ ...w, severity: "warning" as const })),
    ...validation.issues,
  ];

  const questions = (payload.questions as unknown[]) ?? [];
  const mechanics: Record<string, number> = {};
  let mediaCount = 0;
  let hintCount = 0;
  for (const q of questions) {
    if (q && typeof q === "object" && "type" in q) {
      const t = String((q as { type: string }).type);
      mechanics[t] = (mechanics[t] ?? 0) + 1;
      const qq = q as { imageUrl?: string; media?: { url?: string }; hint?: string };
      if (qq.imageUrl || qq.media?.url) mediaCount += 1;
      if (typeof qq.hint === "string" && qq.hint.trim().length > 0) hintCount += 1;
    }
  }

  return {
    ok: validation.ok,
    title: String(payload.title ?? ""),
    questionCount: questions.length,
    mechanics,
    mediaCount,
    hintCount,
    issues,
    normalized: validation.ok ? payload : undefined,
  };
}

export function parseAndPreviewImport(text: string, format: "json" | "markdown" | "auto"): ImportPreviewResult {
  let parsed: { data?: unknown; error?: string };
  if (format === "markdown") {
    parsed = parseMarkdownImport(text);
  } else if (format === "json") {
    parsed = parseJsonImport(text);
  } else {
    const t = text.trim();
    if (t.startsWith("---") || t.startsWith("```")) {
      parsed = parseMarkdownImport(text);
    } else {
      parsed = parseJsonImport(text);
    }
  }

  if (parsed.error) {
    return {
      ok: false,
      issues: [{ code: "PARSE_ERROR", path: "input", message: parsed.error, severity: "error" }],
    };
  }

  return buildImportPreview(parsed.data);
}
