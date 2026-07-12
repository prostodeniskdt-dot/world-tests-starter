/**
 * Нормализация legacy-механик и форматов ответов в канон TestImportPayload.
 */

import type { TestImportPayload, TestQuestion } from "@/lib/test-schema";
import { SUPPORTED_QUESTION_TYPES } from "@/lib/test-schema";

export type NormalizeWarning = { code: string; path: string; message: string };

function isSupportedType(type: string): type is (typeof SUPPORTED_QUESTION_TYPES)[number] {
  return (SUPPORTED_QUESTION_TYPES as readonly string[]).includes(type);
}

/** Конвертация legacy-вопроса в поддерживаемую механику */
export function normalizeLegacyQuestion(
  question: Record<string, unknown>,
  answerKey: Record<string, unknown>,
  questionId: string
): { question: Record<string, unknown>; answer: unknown; warnings: NormalizeWarning[] } {
  const warnings: NormalizeWarning[] = [];
  const type = String(question.type ?? "");
  let q = { ...question };
  let answer = answerKey[questionId];

  if (isSupportedType(type)) {
    if (
      (!String(q.text ?? "").trim()) &&
      typeof question.question === "string" &&
      question.question.trim()
    ) {
      q.text = question.question.trim();
      warnings.push({
        code: "LEGACY_FIELD_ALIAS",
        path: `${questionId}.text`,
        message: "Поле question преобразовано в text",
      });
    }
    return { question: q, answer, warnings };
  }

  switch (type) {
    case "best-example": {
      warnings.push({ code: "LEGACY_CONVERTED", path: questionId, message: "best-example → multiple-choice" });
      q = {
        id: question.id,
        text: question.text ?? "Выберите лучший пример",
        hint: question.hint,
        imageUrl: question.imageUrl,
        videoUrl: question.videoUrl,
        media: question.media,
        type: "multiple-choice",
        options: question.options ?? [],
      };
      break;
    }
    case "scenario": {
      const actionType = question.actionType as string;
      const situation = String(question.situation ?? "");
      const qText = String(question.question ?? question.text ?? "");
      const actions = (question.actions as string[]) ?? [];
      warnings.push({ code: "LEGACY_CONVERTED", path: questionId, message: `scenario (${actionType}) → базовая механика` });
      if (actionType === "order") {
        q = {
          id: question.id,
          text: situation ? `${situation}\n\n${qText}` : qText,
          hint: question.hint,
          type: "ordering",
          items: actions,
        };
      } else if (actionType === "match") {
        const half = Math.ceil(actions.length / 2);
        q = {
          id: question.id,
          text: situation ? `${situation}\n\n${qText}` : qText,
          hint: question.hint,
          type: "matching",
          leftItems: actions.slice(0, half),
          rightItems: actions.slice(half),
          variant: "1-to-1",
        };
      } else {
        q = {
          id: question.id,
          text: situation ? `${situation}\n\n${qText}` : qText,
          hint: question.hint,
          type: "multiple-choice",
          options: actions,
        };
      }
      break;
    }
    case "construct": {
      const blocks = (question.blocks as string[]) ?? [];
      const mode = question.question as string;
      warnings.push({ code: "LEGACY_CONVERTED", path: questionId, message: "construct → ordering/multiple-select" });
      if (mode === "order" || mode === "both") {
        q = {
          id: question.id,
          text: question.text ?? "Упорядочьте элементы",
          hint: question.hint,
          type: "ordering",
          items: blocks,
        };
        if (mode === "both" && answer && typeof answer === "object" && "order" in (answer as object)) {
          answer = (answer as { order: number[] }).order;
        }
      } else {
        q = {
          id: question.id,
          text: question.text ?? "Выберите блоки",
          hint: question.hint,
          type: "multiple-select",
          options: blocks,
        };
        if (answer && typeof answer === "object" && "blocks" in (answer as object)) {
          answer = (answer as { blocks: number[] }).blocks;
        }
      }
      break;
    }
    case "grouping": {
      warnings.push({ code: "LEGACY_CONVERTED", path: questionId, message: "grouping → matching (упрощённо)" });
      const items = (question.items as string[]) ?? [];
      const categories = (question.categories as string[]) ?? [];
      q = {
        id: question.id,
        text: question.text ?? "Сопоставьте элементы с категориями",
        hint: question.hint,
        type: "matching",
        leftItems: items,
        rightItems: categories,
        variant: "1-to-1",
      };
      if (answer && typeof answer === "object" && !Array.isArray(answer)) {
        const pairs: [number, number][] = [];
        for (const [cat, indices] of Object.entries(answer as Record<string, number[]>)) {
          const catIdx = categories.indexOf(cat);
          if (catIdx < 0) continue;
          for (const itemIdx of indices) {
            pairs.push([itemIdx, catIdx]);
          }
        }
        answer = pairs;
      }
      break;
    }
    default:
      warnings.push({ code: "UNKNOWN_TYPE", path: questionId, message: `Неизвестный тип "${type}"`, });
  }

  return { question: q, answer, warnings };
}

/** Нормализация select-errors: если ключ 0-based, а UI использует part.id */
export function normalizeSelectErrorsAnswer(
  question: { markedParts?: Array<{ id: number }> },
  answer: unknown
): unknown {
  if (!Array.isArray(answer) || !question.markedParts?.length) return answer;
  const partIds = question.markedParts.map((p) => p.id).sort((a, b) => a - b);
  const minPartId = partIds[0];
  const maxAnswer = Math.max(...answer.filter((x) => typeof x === "number"));
  // Если все ответы < minPartId и minPartId > 0 — вероятно 0-based индексы
  if (minPartId > 0 && maxAnswer < minPartId) {
    return answer.map((idx: number) => partIds[idx] ?? idx + 1);
  }
  return answer;
}

/** two-step legacy { step1, step2 } → step2Mapping */
export function normalizeTwoStepAnswer(
  answer: unknown,
  step1OptionsCount: number
): unknown {
  if (!answer || typeof answer !== "object") return answer;
  const a = answer as Record<string, unknown>;
  if ("step2Mapping" in a) return answer;
  if ("step1" in a && "step2" in a) {
    const step1 = Number(a.step1);
    const step2 = Number(a.step2);
    return { step1, step2Mapping: { [String(step1)]: step2 } };
  }
  return { step1: 0, step2Mapping: { 0: 0 } };
}

/** Парсинг markedParts из разметки [[фрагмент]] */
export function parseSelectErrorsMarkup(content: string): {
  content: string;
  markedParts: Array<{ id: number; text: string; start: number; end: number }>;
} {
  const markedParts: Array<{ id: number; text: string; start: number; end: number }> = [];
  let plain = "";
  let id = 1;
  const regex = /\[\[([\s\S]*?)\]\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    plain += content.slice(lastIndex, match.index);
    const text = match[1].trim();
    const start = plain.length;
    plain += text;
    markedParts.push({ id, text, start, end: start + text.length });
    id += 1;
    lastIndex = match.index + match[0].length;
  }
  plain += content.slice(lastIndex);
  return { content: plain, markedParts };
}

export function normalizeTestImport(raw: Record<string, unknown>): {
  payload: Record<string, unknown>;
  warnings: NormalizeWarning[];
} {
  const warnings: NormalizeWarning[] = [];
  const questions = Array.isArray(raw.questions) ? [...raw.questions] : [];
  const answerKey = { ...(typeof raw.answerKey === "object" && raw.answerKey ? (raw.answerKey as Record<string, unknown>) : {}) };

  const normalizedQuestions: Record<string, unknown>[] = [];
  for (const q of questions) {
    if (!q || typeof q !== "object") continue;
    const question = q as Record<string, unknown>;
    const qid = String(question.id ?? "");
    const { question: nq, answer, warnings: w } = normalizeLegacyQuestion(question, answerKey, qid);
    warnings.push(...w);
    if (answer !== undefined) answerKey[qid] = answer;

    if (nq.type === "select-errors" && nq.content) {
      const str = String(nq.content);
      if (str.includes("[[")) {
        const parsed = parseSelectErrorsMarkup(str);
        nq.content = parsed.content;
        if (!Array.isArray(nq.markedParts) || (nq.markedParts as unknown[]).length === 0) {
          nq.markedParts = parsed.markedParts;
        }
      }
      answerKey[qid] = normalizeSelectErrorsAnswer(
        nq as { markedParts?: Array<{ id: number }> },
        answerKey[qid]
      );
    }

    if (nq.type === "two-step" && nq.step1) {
      const opts = (nq.step1 as { options?: unknown[] }).options?.length ?? 1;
      answerKey[qid] = normalizeTwoStepAnswer(answerKey[qid], opts);
    }

    normalizedQuestions.push(nq);
  }

  return {
    payload: {
      schemaVersion: raw.schemaVersion ?? 1,
      id: raw.id,
      title: raw.title,
      description: raw.description ?? "",
      category: raw.category ?? "",
      author: raw.author ?? "",
      difficultyLevel: raw.difficultyLevel ?? 1,
      basePoints: raw.basePoints ?? 200,
      maxAttempts: raw.maxAttempts ?? null,
      questions: normalizedQuestions,
      answerKey,
    },
    warnings,
  };
}

/** Восстанавливает обязательный runtime-текст для старых строк БД. */
export function ensureRuntimeQuestionText(
  question: Record<string, unknown>
): Record<string, unknown> {
  if (String(question.text ?? "").trim()) return question;

  const type = String(question.type ?? "");
  let text = "";
  switch (type) {
    case "true-false-enhanced":
      text = String(question.statement ?? "").trim();
      break;
    case "select-errors":
      text = String(question.content ?? "").trim();
      break;
    case "two-step":
      text = String(
        (question.step1 as { question?: unknown } | undefined)?.question ?? ""
      ).trim();
      break;
    case "cloze-dropdown": {
      const gapCount = Array.isArray(question.gaps) ? question.gaps.length : 0;
      const placeholders = Array.from(
        { length: gapCount },
        (_, index) => `[${index + 1}]`
      ).join(" ");
      text = `Заполните пропуски${placeholders ? `: ${placeholders}` : ""}`;
      break;
    }
    case "matching":
      text = "Сопоставьте элементы";
      break;
    case "ordering":
      text = String(question.instruction ?? "").trim() || "Расположите элементы по порядку";
      break;
    case "matrix":
      text = "Заполните матрицу";
      break;
    case "multiple-select":
      text = String(question.instruction ?? "").trim() || "Выберите подходящие варианты";
      break;
    default:
      text = "Выберите правильный ответ";
  }

  return { ...question, text };
}

export function resolveQuestionMedia(q: TestQuestion & { media?: { url?: string } }): string | undefined {
  if (q.media?.url) return q.media.url;
  return q.imageUrl;
}
