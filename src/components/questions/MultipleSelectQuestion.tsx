"use client";

import { CheckSquare, Square } from "lucide-react";
import type { MultipleSelectQuestion as MultipleSelectQuestionType, QuestionAnswer } from "@/tests/types";

interface MultipleSelectQuestionProps {
  question: MultipleSelectQuestionType;
  answer: QuestionAnswer | null;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

export function MultipleSelectQuestion({
  question,
  answer,
  onChange,
  disabled = false,
}: MultipleSelectQuestionProps) {
  const selectedIndices = (answer as number[] | null) || [];

  const toggleOption = (index: number) => {
    if (disabled) return;
    const newSelection = selectedIndices.includes(index)
      ? selectedIndices.filter((i) => i !== index)
      : [...selectedIndices, index];
    onChange(newSelection);
  };

  return (
    <div className="space-y-2">
        {question.options.map((opt, optIdx) => {
          const checked = selectedIndices.includes(optIdx);
          return (
            <label
              key={optIdx}
              className={`flex items-center gap-3 rounded-lg border-2 px-3 py-3 sm:px-4 sm:py-3 transition-all min-h-[44px] touch-manipulation ${
                disabled
                  ? checked
                    ? "border-green-500 bg-green-50 shadow-lg cursor-default"
                    : "border-zinc-200 bg-zinc-50 cursor-not-allowed opacity-60"
                  : checked
                  ? "border-green-500 bg-green-50 shadow-lg cursor-pointer hover:shadow-xl"
                  : "border-zinc-200 hover:border-primary-300 hover:bg-zinc-50 cursor-pointer"
              }`}
            >
              <div className="flex-shrink-0">
                {checked ? (
                  <CheckSquare className="h-6 w-6 text-green-600" />
                ) : (
                  <Square className="h-6 w-6 text-zinc-400" />
                )}
              </div>
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggleOption(optIdx)}
                className="hidden"
              />
              <span className={`flex-1 min-w-0 text-base sm:text-sm break-words leading-relaxed ${checked ? "font-medium text-zinc-900" : "text-zinc-700"}`}>
                {opt}
              </span>
              {checked && (
                <span className="flex-shrink-0 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                  ✓
                </span>
              )}
            </label>
          );
        })}
    </div>
  );
}
