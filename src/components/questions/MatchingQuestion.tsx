"use client";

import { useEffect, useState } from "react";
import type { MatchingQuestion as MatchingQuestionType, QuestionAnswer } from "@/tests/types";

interface MatchingQuestionProps {
  question: MatchingQuestionType;
  answer: QuestionAnswer | null;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

export function MatchingQuestion({
  question,
  answer,
  onChange,
  disabled = false,
}: MatchingQuestionProps) {
  const [selections, setSelections] = useState<number[]>(
    () => Array.from({ length: question.leftItems.length }, () => -1)
  );

  useEffect(() => {
    if (Array.isArray(answer) && answer.length > 0) {
      const nextSelections = Array.from({ length: question.leftItems.length }, () => -1);
      for (const pair of answer as [number, number][]) {
        const [leftIdx, rightIdx] = pair;
        if (leftIdx >= 0 && leftIdx < nextSelections.length) {
          nextSelections[leftIdx] = rightIdx;
        }
      }
      setSelections(nextSelections);
    }
  }, [answer, question.leftItems.length, question.id]);

  const handleChange = (leftIdx: number, rightIdx: number) => {
    if (disabled) return;
    const nextSelections = [...selections];
    nextSelections[leftIdx] = rightIdx;
    setSelections(nextSelections);

    const isComplete = nextSelections.every((idx) => idx >= 0);
    if (!isComplete) {
      onChange(null);
      return;
    }

    const pairs: [number, number][] = nextSelections.map((right, left) => [left, right]);
    onChange(pairs);
  };

  return (
    <div className="space-y-3">
      {question.leftItems.map((leftItem, leftIdx) => (
        <div
          key={`${question.id}-${leftIdx}`}
          className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 sm:flex-row sm:items-center"
        >
          <div className="text-sm font-medium text-zinc-900 sm:flex-1">{leftItem}</div>
          <select
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 sm:w-64"
            value={selections[leftIdx] >= 0 ? selections[leftIdx] : ""}
            onChange={(event) => handleChange(leftIdx, Number(event.target.value))}
            disabled={disabled}
          >
            <option value="" disabled>
              Выберите вариант
            </option>
            {question.rightItems.map((rightItem, rightIdx) => (
              <option key={`${question.id}-${leftIdx}-${rightIdx}`} value={rightIdx}>
                {rightItem}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
