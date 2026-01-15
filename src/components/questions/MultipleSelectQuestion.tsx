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
      {question.instruction && (
        <div className="text-sm text-zinc-600 mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          {question.instruction}
        </div>
      )}
      <div className="text-sm text-zinc-500 mb-2">
        Выбрано: {selectedIndices.length} из {question.options.length}
      </div>
      {question.options.map((opt, optIdx) => {
        const checked = selectedIndices.includes(optIdx);
        return (
          <label
            key={optIdx}
            className={`flex items-center gap-3 rounded-lg border-2 px-3 py-3 sm:px-4 sm:py-3 transition-all min-h-[44px] touch-manipulation ${
              disabled
                ? checked
                  ? "border-primary-500 bg-primary-50 shadow-md cursor-default"
                  : "border-zinc-200 bg-zinc-50 cursor-not-allowed opacity-60"
                : checked
                ? "border-primary-500 bg-primary-50 shadow-md cursor-pointer"
                : "border-zinc-200 hover:border-primary-300 hover:bg-zinc-50 cursor-pointer"
            }`}
          >
            <div className="flex-shrink-0">
              {checked ? (
                <CheckSquare className="h-5 w-5 text-primary-600" />
              ) : (
                <Square className="h-5 w-5 text-zinc-600" />
              )}
            </div>
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={() => toggleOption(optIdx)}
              className="hidden"
            />
            <span className="text-zinc-700 flex-1 text-base sm:text-sm">{opt}</span>
          </label>
        );
      })}
    </div>
  );
}
