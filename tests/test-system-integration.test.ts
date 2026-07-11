import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { paginateItems } from "../src/components/tests/TestPagination";
import { buildImportPreview, parseJsonImport, parseMarkdownImport } from "../src/lib/test-import/parse";
import { normalizeTestImport } from "../src/lib/test-import/normalize";

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
