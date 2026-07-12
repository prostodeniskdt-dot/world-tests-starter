import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isAnswerComplete } from "../src/lib/question-answer-utils";
import { validateTestPayload } from "../src/lib/test-schema";
import type { PublicTestQuestion } from "../src/tests/types";
import {
  normalizeQuestionByType,
  remapOrderingAnswer,
} from "../src/lib/test-editor-utils";

const base = { id: "q1", text: "Вопрос" };

describe("question mechanic answer completeness", () => {
  it("checks option bounds and duplicate selections", () => {
    const single = {
      ...base,
      type: "multiple-choice",
      options: ["A", "B"],
    } as PublicTestQuestion;
    assert.equal(isAnswerComplete(single, 1), true);
    assert.equal(isAnswerComplete(single, 2), false);

    const multiple = {
      ...base,
      type: "multiple-select",
      options: ["A", "B", "C"],
    } as PublicTestQuestion;
    assert.equal(isAnswerComplete(multiple, [0, 2]), true);
    assert.equal(isAnswerComplete(multiple, [0, 0]), false);
    assert.equal(isAnswerComplete(multiple, [3]), false);
  });

  it("requires a visible reason for enhanced true/false questions", () => {
    const question = {
      ...base,
      type: "true-false-enhanced",
      statement: "Утверждение",
      reasons: ["Причина 1", "Причина 2"],
    } as PublicTestQuestion;
    assert.equal(isAnswerComplete(question, { answer: true, reason: 1 }), true);
    assert.equal(isAnswerComplete(question, { answer: true, reason: 2 }), false);
  });

  it("supports shared cloze distractors and rejects unavailable options", () => {
    const question = {
      ...base,
      type: "cloze-dropdown",
      gaps: [{ index: 0, options: ["A", "B"] }],
      extraOptions: ["C"],
    } as PublicTestQuestion;
    assert.equal(isAnswerComplete(question, [2]), true);
    assert.equal(isAnswerComplete(question, [3]), false);
  });

  it("validates selectable fragment ids", () => {
    const question = {
      ...base,
      type: "select-errors",
      content: "Текст",
      markedParts: [{ id: 5, text: "Текст", start: 0, end: 5 }],
      allowMultiple: false,
    } as PublicTestQuestion;
    assert.equal(isAnswerComplete(question, [5]), true);
    assert.equal(isAnswerComplete(question, [0]), false);
    assert.equal(isAnswerComplete(question, [5, 5]), false);
  });

  it("requires complete matching and ordering permutations", () => {
    const matching = {
      ...base,
      type: "matching",
      leftItems: ["A", "B"],
      rightItems: ["1", "2"],
      variant: "1-to-1",
    } as PublicTestQuestion;
    assert.equal(isAnswerComplete(matching, [[0, 1], [1, 0]]), true);
    assert.equal(isAnswerComplete(matching, [[0, 0], [0, 1]]), false);
    assert.equal(isAnswerComplete(matching, [[0, 0], [1, 0]]), false);

    const ordering = {
      ...base,
      type: "ordering",
      items: ["A", "B", "C"],
    } as PublicTestQuestion;
    assert.equal(isAnswerComplete(ordering, [2, 0, 1]), true);
    assert.equal(isAnswerComplete(ordering, [0, 0, 1]), false);
    assert.equal(isAnswerComplete(ordering, [0, 1, 3]), false);
  });

  it("checks both two-step option ranges", () => {
    const question = {
      ...base,
      type: "two-step",
      step1: { question: "Шаг 1", options: ["A", "B"] },
      step2: { question: "Шаг 2", options: ["C", "D"] },
    } as PublicTestQuestion;
    assert.equal(isAnswerComplete(question, { step1: 1, step2: 0 }), true);
    assert.equal(isAnswerComplete(question, { step1: 2, step2: 0 }), false);
    assert.equal(isAnswerComplete(question, { step1: 1, step2: 2 }), false);
  });

  it("requires every matrix row and valid columns", () => {
    const single = {
      ...base,
      type: "matrix",
      rows: ["A", "B"],
      columns: ["1", "2"],
      matrixType: "single-select",
    } as PublicTestQuestion;
    assert.equal(isAnswerComplete(single, { 0: 1, 1: 0 }), true);
    assert.equal(isAnswerComplete(single, { 0: 1 }), false);
    assert.equal(isAnswerComplete(single, { 0: 1, 1: 2 }), false);

    const multiple = { ...single, matrixType: "multiple-select" } as PublicTestQuestion;
    assert.equal(isAnswerComplete(multiple, { 0: [0, 1], 1: [1] }), true);
    assert.equal(isAnswerComplete(multiple, { 0: [0, 0], 1: [1] }), false);
  });
});

describe("question mechanic answer-key validation", () => {
  const payload = (question: Record<string, unknown>, answer: unknown) => ({
    title: "Тест",
    questions: [{ ...base, ...question }],
    answerKey: { q1: answer },
  });

  it("rejects incomplete matrix keys", () => {
    const result = validateTestPayload(
      payload(
        {
          type: "matrix",
          rows: ["A", "B"],
          columns: ["1", "2"],
          matrixType: "single-select",
        },
        { 0: 1 }
      )
    );
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.code === "MATRIX_INCOMPLETE"));
  });

  it("rejects non-permutation ordering keys", () => {
    const result = validateTestPayload(
      payload({ type: "ordering", items: ["A", "B", "C"] }, [0, 0, 1])
    );
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.code === "ORDERING_NOT_PERMUTATION"));
  });

  it("rejects missing two-step mappings", () => {
    const result = validateTestPayload(
      payload(
        {
          type: "two-step",
          step1: { question: "Шаг 1", options: ["A", "B"] },
          step2: { question: "Шаг 2", options: ["C", "D"] },
        },
        { step1: 1, step2Mapping: { 0: 0 } }
      )
    );
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.code === "ANSWER_OUT_OF_RANGE"));
  });
});

describe("question editor mechanic transitions", () => {
  it("preserves question media when changing mechanic", () => {
    const normalized = normalizeQuestionByType(
      {
        id: "q1",
        text: "Вопрос",
        hint: "Подсказка",
        imageUrl: "https://example.com/image.jpg",
        videoUrl: "https://example.com/video",
        media: {
          type: "image",
          url: "https://example.com/image.jpg",
          alt: "Описание",
        },
      },
      "ordering"
    );
    assert.equal(normalized.imageUrl, "https://example.com/image.jpg");
    assert.equal(normalized.videoUrl, "https://example.com/video");
    assert.equal(normalized.media.alt, "Описание");
  });

  it("keeps ordering semantics when item lines change", () => {
    assert.deepEqual(
      remapOrderingAnswer(["A", "B", "C"], ["C", "A", "D"], [1, 2, 0]),
      [0, 1, 2]
    );
    assert.deepEqual(
      remapOrderingAnswer(["A", "A", "B"], ["A", "B", "A"], [2, 1, 0]),
      [1, 2, 0]
    );
  });
});
