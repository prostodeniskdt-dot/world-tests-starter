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
    <div className="space-y-4">
      {question.instruction && (
        <div className="text-sm font-medium text-zinc-700 mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          ℹ️ {question.instruction}
        </div>
      )}
      
      {/* Визуальный счетчик и прогресс */}
      <div className="p-3 bg-gradient-to-r from-primary-50 to-accent-50 border-2 border-primary-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-700">
            ✓ Выбрано вариантов:
          </span>
          <span className="text-lg font-bold text-primary-600">
            {selectedIndices.length}
          </span>
        </div>
        {selectedIndices.length > 0 && (
          <div className="text-xs text-zinc-600">
            Выбранные: {selectedIndices.map(idx => question.options[idx]).join(", ")}
          </div>
        )}
      </div>

      {/* Выбранные варианты (если есть) */}
      {selectedIndices.length > 0 && (
        <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2 text-sm flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Ваш выбор ({selectedIndices.length}):
          </h4>
          <div className="space-y-2">
            {selectedIndices.sort((a, b) => a - b).map((idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded border border-green-200">
                <span className="flex-shrink-0 bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                <span className="flex-1 text-sm text-zinc-700">{question.options[idx]}</span>
                {!disabled && (
                  <button
                    onClick={() => toggleOption(idx)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded px-2 py-1 text-xs transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-sm font-medium text-zinc-700 mb-2">
        Все варианты ответов:
      </div>
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
              <span className={`flex-1 text-base sm:text-sm ${checked ? "font-medium text-zinc-900" : "text-zinc-700"}`}>
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
    </div>
  );
}
