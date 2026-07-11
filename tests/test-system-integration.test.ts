import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { paginateItems } from "../src/components/tests/TestPagination";
import { buildImportPreview, parseJsonImport, parseMarkdownImport } from "../src/lib/test-import/parse";
import { normalizeTestImport } from "../src/lib/test-import/normalize";
import { validateTestForServer } from "../src/lib/test-import/validate-server";
import {
  createTestEditorDraft,
  readTestEditorDraft,
} from "../src/components/admin/test-editor/useTestEditorDraft";

describe("catalog pagination", () => {
  it("paginateItems returns correct slice", () => {
    const items = Array.from({ length: 20 }, (_, i) => i + 1);
    assert.deepEqual(paginateItems(items, 1, 9), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    assert.deepEqual(paginateItems(items, 2, 9), [10, 11, 12, 13, 14, 15, 16, 17, 18]);
    assert.deepEqual(paginateItems(items, 3, 9), [19, 20]);
  });
});

describe("test import parse", () => {
  it("parses JSON import preview", () => {
    const json = JSON.stringify({
      title: "T",
      questions: [{ id: "q1", type: "multiple-choice", text: "?", options: ["a", "b"] }],
      answerKey: { q1: 0 },
    });
    const parsed = parseJsonImport(json);
    assert.ok(parsed.data);
    const preview = buildImportPreview(parsed.data);
    assert.equal(preview.ok, true);
    assert.equal(preview.questionCount, 1);
  });

  it("parses markdown with frontmatter and json block", () => {
    const md = `---
title: MD Test
category: demo
---
# Test
\`\`\`json
{
  "questions": [{ "id": "q1", "type": "true-false-enhanced", "text": "?", "statement": "Утверждение", "reasons": ["r1"] }],
  "answerKey": { "q1": { "answer": true, "reason": 0 } }
}
\`\`\``;
    const parsed = parseMarkdownImport(md);
    assert.ok(parsed.data);
    const preview = buildImportPreview(parsed.data);
    assert.equal(preview.ok, true);
    assert.equal(preview.title, "MD Test");
  });

  it("preserves hint through JSON parse, preview, normalization and server validation", () => {
    const questions = [
      {
        id: "q1",
        type: "multiple-choice",
        text: "MC",
        hint: "Подсказка MC",
        options: ["a", "b"],
      },
      {
        id: "q2",
        type: "multiple-select",
        text: "MS",
        hint: "Подсказка MS",
        options: ["a", "b"],
      },
      {
        id: "q3",
        type: "true-false-enhanced",
        text: "TF",
        hint: "Подсказка TF",
        statement: "Statement",
        reasons: ["Reason"],
      },
      {
        id: "q4",
        type: "cloze-dropdown",
        text: "[1]",
        hint: "Подсказка cloze",
        gaps: [{ index: 0, options: ["a", "b"] }],
      },
      {
        id: "q5",
        type: "select-errors",
        text: "Errors",
        hint: "Подсказка errors",
        content: "[[Ошибка]]",
        allowMultiple: false,
      },
      {
        id: "q6",
        type: "matching",
        text: "Match",
        hint: "Подсказка matching",
        leftItems: ["a"],
        rightItems: ["b"],
      },
      {
        id: "q7",
        type: "ordering",
        text: "Order",
        hint: "Подсказка ordering",
        items: ["a", "b"],
      },
      {
        id: "q8",
        type: "two-step",
        text: "Two step",
        hint: "Подсказка two-step",
        step1: { question: "First", options: ["a"] },
        step2: { question: "Second", options: ["b"] },
      },
      {
        id: "q9",
        type: "matrix",
        text: "Matrix",
        hint: "Подсказка matrix",
        rows: ["row"],
        columns: ["column"],
        matrixType: "single-select",
      },
    ];
    const answerKey = {
      q1: 0,
      q2: [0],
      q3: { answer: true, reason: 0 },
      q4: [0],
      q5: [1],
      q6: [[0, 0]],
      q7: [0, 1],
      q8: { step1: 0, step2Mapping: { "0": 0 } },
      q9: { "0": 0 },
    };
    const json = JSON.stringify({
      schemaVersion: 1,
      title: "Hints",
      questions,
      answerKey,
    });

    const parsed = parseJsonImport(json);
    assert.ok(parsed.data);

    const preview = buildImportPreview(parsed.data);
    assert.equal(preview.ok, true);
    assert.equal(preview.hintCount, questions.length);
    const previewQuestions = preview.normalized?.questions as Array<{ id: string; hint?: string }>;
    assert.deepEqual(
      previewQuestions.map((q) => q.hint),
      questions.map((q) => q.hint)
    );

    const serverValidation = validateTestForServer(preview.normalized);
    assert.equal(serverValidation.ok, true);
    const persistedQuestions = serverValidation.payload?.questions as Array<{ id: string; hint?: string }>;
    assert.deepEqual(
      persistedQuestions.map((q) => q.hint),
      questions.map((q) => q.hint)
    );
  });

  it("preserves hint in Markdown import", () => {
    const md = `---
title: Markdown hints
---
\`\`\`json
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "text": "Question",
      "hint": "Markdown hint",
      "options": ["a", "b"]
    }
  ],
  "answerKey": { "q1": 0 }
}
\`\`\``;
    const parsed = parseMarkdownImport(md);
    assert.ok(parsed.data);
    const preview = buildImportPreview(parsed.data);
    assert.equal(preview.ok, true);
    assert.equal(preview.hintCount, 1);
    const importedQuestions = preview.normalized?.questions as Array<{ hint?: string }>;
    assert.equal(importedQuestions[0].hint, "Markdown hint");
  });

  it("does not count empty hints as imported hints", () => {
    const preview = buildImportPreview({
      title: "No hint",
      questions: [
        { id: "q1", type: "multiple-choice", text: "?", hint: "   ", options: ["a", "b"] },
      ],
      answerKey: { q1: 0 },
    });
    assert.equal(preview.ok, true);
    assert.equal(preview.hintCount, 0);
  });
});

describe("runtime normalize on read", () => {
  it("converts legacy best-example when loading from db shape", () => {
    const { payload } = normalizeTestImport({
      questions: [{ id: "q1", type: "best-example", text: "Pick", options: ["a", "b"] }],
      answerKey: { q1: 1 },
    });
    const questions = payload.questions as Array<{ type: string }>;
    assert.equal(questions[0].type, "multiple-choice");
    assert.equal((payload.answerKey as Record<string, number>).q1, 1);
  });
});

describe("question answer completeness", () => {
  it("requires explicit reason for multi-reason true-false", async () => {
    const { isAnswerComplete } = await import("../src/lib/question-answer-utils");
    const q = {
      id: "q1",
      type: "true-false-enhanced" as const,
      text: "t",
      statement: "s",
      reasons: ["a", "b"],
    };
    assert.equal(isAnswerComplete(q, { answer: true }), false);
    assert.equal(isAnswerComplete(q, { answer: true, reason: 1 }), true);
  });
});

describe("test editor draft versioning", () => {
  const serverTest = {
    id: "imported-test",
    updatedAt: "2026-07-12T00:40:00.000Z",
    questions: [{ id: "q1", hint: "Серверная подсказка" }],
  };

  it("restores a draft only for the same server record version", () => {
    const draft = createTestEditorDraft(serverTest.id, serverTest.updatedAt, {
      ...serverTest,
      questions: [{ id: "q1", hint: "Изменённая подсказка" }],
    });
    const restored = readTestEditorDraft(
      JSON.stringify(draft),
      serverTest.id,
      serverTest.updatedAt
    );
    assert.equal(restored?.questions[0].hint, "Изменённая подсказка");
  });

  it("rejects a stale draft after a test was re-imported", () => {
    const draft = createTestEditorDraft(serverTest.id, serverTest.updatedAt, {
      ...serverTest,
      questions: [{ id: "q1", hint: "" }],
    });
    const restored = readTestEditorDraft(
      JSON.stringify(draft),
      serverTest.id,
      "2026-07-12T00:43:32.000Z"
    );
    assert.equal(restored, null);
  });

  it("rejects legacy unversioned drafts that could overwrite imported hints", () => {
    const legacyDraft = JSON.stringify({
      id: serverTest.id,
      questions: [{ id: "q1", hint: "" }],
    });
    assert.equal(
      readTestEditorDraft(legacyDraft, serverTest.id, serverTest.updatedAt),
      null
    );
  });
});
