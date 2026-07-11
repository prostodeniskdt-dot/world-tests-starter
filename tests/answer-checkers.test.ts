import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  checkSelectErrors,
  checkClozeDropdown,
  checkTrueFalseEnhanced,
  checkMatchingPairs,
} from "../src/lib/answer-checkers";

describe("answer-checkers select-errors id normalization", () => {
  it("converts 0-based key to part ids when user selects by id", () => {
    assert.equal(checkSelectErrors([1, 2], [0, 1]), true);
  });

  it("matches when both use part ids", () => {
    assert.equal(checkSelectErrors([1, 2], [1, 2]), true);
  });
});

describe("answer-checkers cloze strict", () => {
  it("requires exact index match", () => {
    assert.equal(checkClozeDropdown([0, 1], [0, 1]), true);
    assert.equal(checkClozeDropdown([1, 0], [0, 1]), false);
  });
});

describe("answer-checkers true-false with single reason", () => {
  it("ignores reason when only one reason slot", () => {
    assert.equal(
      checkTrueFalseEnhanced({ answer: true, reason: 5 }, { answer: true, reason: 0 }, 1),
      true
    );
  });

  it("checks reason when multiple reasons", () => {
    assert.equal(
      checkTrueFalseEnhanced({ answer: false, reason: 1 }, { answer: false, reason: 1 }, 3),
      true
    );
    assert.equal(
      checkTrueFalseEnhanced({ answer: false, reason: 0 }, { answer: false, reason: 1 }, 3),
      false
    );
  });
});

describe("answer-checkers matching 1-based legacy", () => {
  it("normalizes all-1-based pairs", () => {
    assert.equal(
      checkMatchingPairs(
        [
          [0, 0],
          [1, 2],
        ],
        [
          [1, 1],
          [2, 3],
        ]
      ),
      true
    );
  });
});
