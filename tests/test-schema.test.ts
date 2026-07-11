import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateTestPayload } from "../src/lib/test-schema";
import { normalizeTestImport } from "../src/lib/test-import/normalize";

describe("test schema validation", () => {
  it("accepts minimal valid multiple-choice test", () => {
    const payload = {
      title: "Test",
      questions: [
        { id: "q1", type: "multiple-choice", text: "Q?", options: ["A", "B"] },
      ],
      answerKey: { q1: 0 },
    };
    const result = validateTestPayload(payload);
    assert.equal(result.ok, true);
  });

  it("rejects duplicate question ids", () => {
    const payload = {
      title: "Test",
      questions: [
        { id: "q1", type: "multiple-choice", text: "Q1?", options: ["A", "B"] },
        { id: "q1", type: "multiple-choice", text: "Q2?", options: ["A", "B"] },
      ],
      answerKey: { q1: 0 },
    };
    const result = validateTestPayload(payload);
    assert.equal(result.ok, false);
  });
});

describe("legacy normalize", () => {
  it("converts best-example to multiple-choice", () => {
    const { payload, warnings } = normalizeTestImport({
      title: "T",
      questions: [{ id: "q1", type: "best-example", text: "Pick", options: ["a", "b"] }],
      answerKey: { q1: 1 },
    });
    const q = (payload.questions as any[])[0];
    assert.equal(q.type, "multiple-choice");
    assert.ok(warnings.some((w) => w.code === "LEGACY_CONVERTED"));
  });
});
