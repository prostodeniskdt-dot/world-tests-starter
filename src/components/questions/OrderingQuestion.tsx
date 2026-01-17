"use client";

import { useEffect, useState } from "react";
import type { OrderingQuestion as OrderingQuestionType, QuestionAnswer } from "@/tests/types";

interface OrderingQuestionProps {
  question: OrderingQuestionType;
  answer: QuestionAnswer | null;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

export function OrderingQuestion({
  question,
  answer,
  onChange,
  disabled = false,
}: OrderingQuestionProps) {
  const [positions, setPositions] = useState<number[]>(
    () => Array.from({ length: question.items.length }, () => -1)
  );

  useEffect(() => {
    if (Array.isArray(answer) && answer.length === question.items.length) {
      const nextPositions = Array.from({ length: question.items.length }, () => -1);
      (answer as number[]).forEach((itemIdx, positionIdx) => {
        if (itemIdx >= 0 && itemIdx < nextPositions.length) {
          nextPositions[itemIdx] = positionIdx;
        }
      });
      setPositions(nextPositions);
    }
  }, [answer, question.items.length, question.id]);

  const buildOrder = (nextPositions: number[]) => {
    const order = Array.from({ length: question.items.length }, () => -1);
    nextPositions.forEach((position, itemIdx) => {
      if (position >= 0 && position < order.length) {
        order[position] = itemIdx;
      }
    });
    return order;
  };

  const handleChange = (itemIdx: number, positionIdx: number) => {
    if (disabled) return;
    const nextPositions = [...positions];

    nextPositions.forEach((pos, idx) => {
      if (idx !== itemIdx && pos === positionIdx) {
        nextPositions[idx] = -1;
      }
    });

    nextPositions[itemIdx] = positionIdx;
    setPositions(nextPositions);

    const order = buildOrder(nextPositions);
    const isComplete = order.every((idx) => idx >= 0);
    onChange(isComplete ? order : null);
  };

  return (
    <div className="space-y-3">
      {question.items.map((item, itemIdx) => (
        <div
          key={`${question.id}-${itemIdx}`}
          className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 sm:flex-row sm:items-center"
        >
          <div className="text-sm font-medium text-zinc-900 sm:flex-1">{item}</div>
          <select
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 sm:w-40"
            value={positions[itemIdx] >= 0 ? positions[itemIdx] : ""}
            onChange={(event) => handleChange(itemIdx, Number(event.target.value))}
            disabled={disabled}
          >
            <option value="" disabled>
              Позиция
            </option>
            {question.items.map((_, positionIdx) => (
              <option key={`${question.id}-${itemIdx}-pos-${positionIdx}`} value={positionIdx}>
                {positionIdx + 1}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
