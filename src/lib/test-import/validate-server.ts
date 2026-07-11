import { normalizeTestImport } from "@/lib/test-import/normalize";
import { validateTestPayload, type ValidationIssue } from "@/lib/test-schema";

export function validateTestForServer(data: unknown): {
  ok: boolean;
  payload?: Record<string, unknown>;
  issues: ValidationIssue[];
} {
  if (!data || typeof data !== "object") {
    return {
      ok: false,
      issues: [{ code: "INVALID_INPUT", path: "root", message: "Ожидается объект", severity: "error" }],
    };
  }

  const { payload, warnings } = normalizeTestImport(data as Record<string, unknown>);
  const result = validateTestPayload(payload);

  return {
    ok: result.ok,
    payload: result.data as unknown as Record<string, unknown>,
    issues: [
      ...warnings.map((w) => ({ ...w, severity: "warning" as const })),
      ...result.issues,
    ],
  };
}

export function formatValidationIssues(issues: ValidationIssue[]): string {
  return issues
    .filter((i) => i.severity === "error")
    .map((i) => `${i.path}: ${i.message}`)
    .join("; ");
}
