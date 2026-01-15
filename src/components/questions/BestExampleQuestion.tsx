"use client";

import { CheckCircle2, Circle } from "lucide-react";
import type { BestExampleQuestion as BestExampleQuestionType, QuestionAnswer } from "@/tests/types";

interface BestExampleQuestionProps {
  question: BestExampleQuestionType;
  answer: QuestionAnswer | null;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

export function BestExampleQuestion({
  question,
  answer,
  onChange,
  disabled = false,
}: BestExampleQuestionProps) {
  const selectedIndex = answer as number | null;

  return (
    <div className="space-y-4">
      {question.context && (
        <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 mb-4">
          <p className="text-base sm:text-lg text-zinc-900">{question.context}</p>
        </div>
      )}
      <div className="space-y-2">
        {question.options.map((opt, optIdx) => {
          const checked = selectedIndex === optIdx;
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
                  <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <Circle className="h-5 w-5 text-zinc-600" />
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
              <span className="text-zinc-700 flex-1 text-base sm:text-sm">{opt}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
