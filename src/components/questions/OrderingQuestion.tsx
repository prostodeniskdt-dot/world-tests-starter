"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import type { OrderingQuestion as OrderingQuestionType, QuestionAnswer } from "@/tests/types";
import { MobileOptimizedButton } from "./shared/MobileOptimizedButton";

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
  const order = (answer as number[] | null) || question.items.map((_, i) => i);

  const moveUp = (index: number) => {
    if (disabled || index === 0) return;
    const newOrder = [...order];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onChange(newOrder);
  };

  const moveDown = (index: number) => {
    if (disabled || index === order.length - 1) return;
    const newOrder = [...order];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onChange(newOrder);
  };

  return (
    <div className="space-y-4">
      {question.instruction && (
        <div className="text-sm text-zinc-600 mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          {question.instruction}
        </div>
      )}
      <div className="space-y-2">
        {order.map((itemIndex, displayIndex) => {
          const item = question.items[itemIndex];
          const isExtra = question.extraItems?.includes(itemIndex);
          return (
            <div
              key={itemIndex}
              className={`flex items-center gap-2 p-3 sm:p-4 rounded-lg border-2 min-h-[44px] ${
                isExtra
                  ? "border-amber-300 bg-amber-50"
                  : "border-zinc-200 bg-white"
              }`}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                {displayIndex + 1}
              </div>
              <div className="flex-1 text-base sm:text-sm text-zinc-700">{item}</div>
              {isExtra && (
                <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
                  Лишний
                </span>
              )}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveUp(displayIndex)}
                  disabled={disabled || displayIndex === 0}
                  className="p-1 rounded hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[32px] min-w-[32px] flex items-center justify-center"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => moveDown(displayIndex)}
                  disabled={disabled || displayIndex === order.length - 1}
                  className="p-1 rounded hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[32px] min-w-[32px] flex items-center justify-center"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
