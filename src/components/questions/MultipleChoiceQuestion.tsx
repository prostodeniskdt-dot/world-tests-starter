"use client";

import { CheckCircle2, Circle } from "lucide-react";
import type { MultipleChoiceQuestion as MultipleChoiceQuestionType, QuestionAnswer } from "@/tests/types";

interface MultipleChoiceQuestionProps {
  question: MultipleChoiceQuestionType;
  answer: QuestionAnswer | null;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

export function MultipleChoiceQuestion({
  question,
  answer,
  onChange,
  disabled = false,
}: MultipleChoiceQuestionProps) {
  const selectedIndex = answer as number | null;

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-zinc-700 mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
        📋 Выберите один правильный ответ
      </div>
      {question.options.map((opt, optIdx) => {
        const checked = selectedIndex === optIdx;
        const letter = String.fromCharCode(65 + optIdx); // A, B, C, D...
        
        return (
          <label
            key={optIdx}
            className={`flex items-center gap-3 rounded-lg border-2 px-3 py-3 sm:px-4 sm:py-3 transition-all min-h-[44px] touch-manipulation ${
              disabled
                ? checked
                  ? "border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg cursor-default ring-2 ring-green-300"
                  : "border-zinc-200 bg-zinc-50 cursor-not-allowed opacity-60"
                : checked
                ? "border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg cursor-pointer ring-2 ring-green-300 scale-[1.02]"
                : "border-zinc-300 hover:border-primary-400 hover:bg-primary-50 cursor-pointer hover:shadow-md"
            }`}
          >
            <div className="flex-shrink-0">
              {checked ? (
                <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">{letter}</span>
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full border-2 border-zinc-400 bg-white flex items-center justify-center hover:border-primary-500 transition-colors">
                  <span className="text-zinc-600 font-bold text-sm">{letter}</span>
                </div>
              )}
            </div>
            <input
              type="radio"
              name={question.id}
              checked={checked}
              disabled={disabled}
              onChange={() => {
                if (disabled) return;
                onChange(optIdx);
              }}
              className="hidden"
            />
            <span className={`flex-1 text-base sm:text-sm break-words leading-relaxed ${
              checked ? "font-medium text-zinc-900" : "text-zinc-700"
            }`}>
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
