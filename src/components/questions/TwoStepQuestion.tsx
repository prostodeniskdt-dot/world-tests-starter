"use client";

import { useEffect, useState } from "react";
import type { TwoStepQuestion as TwoStepQuestionType, QuestionAnswer } from "@/tests/types";

interface TwoStepQuestionProps {
  question: TwoStepQuestionType;
  answer: QuestionAnswer | null;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

export function TwoStepQuestion({
  question,
  answer,
  onChange,
  disabled = false,
}: TwoStepQuestionProps) {
  const [step1Value, setStep1Value] = useState<number | null>(null);
  const [step2Value, setStep2Value] = useState<number | null>(null);

  useEffect(() => {
    if (answer && typeof answer === "object" && "step1" in answer && "step2" in answer) {
      setStep1Value((answer as { step1: number }).step1);
      setStep2Value((answer as { step2: number }).step2);
    }
  }, [answer, question.id]);

  const commitAnswer = (nextStep1: number | null, nextStep2: number | null) => {
    if (nextStep1 === null || nextStep2 === null) {
      onChange(null);
      return;
    }
    onChange({ step1: nextStep1, step2: nextStep2 });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-3 sm:p-4 space-y-2">
        <div className="text-sm font-semibold text-zinc-900">{question.step1.question}</div>
        <div className="space-y-2">
          {question.step1.options.map((option, idx) => (
            <label
              key={`${question.id}-step1-${idx}`}
              className={`flex items-center gap-3 rounded-lg border-2 px-3 py-3 sm:px-4 sm:py-3 min-h-[44px] touch-manipulation transition-colors ${
                disabled
                  ? step1Value === idx
                    ? "border-green-500 bg-green-50"
                    : "border-zinc-200 bg-zinc-50 text-zinc-500"
                  : step1Value === idx
                  ? "border-green-500 bg-green-50"
                  : "border-zinc-300 hover:border-primary-400 hover:bg-primary-50"
              }`}
            >
              <input
                type="radio"
                name={`${question.id}-step1`}
                checked={step1Value === idx}
                disabled={disabled}
                onChange={() => {
                  if (disabled) return;
                  setStep1Value(idx);
                  commitAnswer(idx, step2Value);
                }}
                className="hidden"
              />
              <span className="flex-1 min-w-0 text-sm sm:text-base break-words">{option}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-3 sm:p-4 space-y-2">
        <div className="text-sm font-semibold text-zinc-900">{question.step2.question}</div>
        <div className="space-y-2">
          {question.step2.options.map((option, idx) => (
            <label
              key={`${question.id}-step2-${idx}`}
              className={`flex items-center gap-3 rounded-lg border-2 px-3 py-3 sm:px-4 sm:py-3 min-h-[44px] touch-manipulation transition-colors ${
                disabled
                  ? step2Value === idx
                    ? "border-green-500 bg-green-50"
                    : "border-zinc-200 bg-zinc-50 text-zinc-500"
                  : step2Value === idx
                  ? "border-green-500 bg-green-50"
                  : "border-zinc-300 hover:border-primary-400 hover:bg-primary-50"
              }`}
            >
              <input
                type="radio"
                name={`${question.id}-step2`}
                checked={step2Value === idx}
                disabled={disabled}
                onChange={() => {
                  if (disabled) return;
                  setStep2Value(idx);
                  commitAnswer(step1Value, idx);
                }}
                className="hidden"
              />
              <span className="flex-1 min-w-0 text-sm sm:text-base break-words">{option}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
