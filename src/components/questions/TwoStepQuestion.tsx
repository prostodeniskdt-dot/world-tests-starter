"use client";

import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
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
  const currentAnswer = (answer as { step1: number; step2: number } | null) || {
    step1: null as any,
    step2: null as any,
  };
  const [step, setStep] = useState<1 | 2>(currentAnswer.step1 === null ? 1 : 2);

  const handleStep1 = (index: number) => {
    if (disabled) return;
    onChange({ step1: index, step2: currentAnswer.step2 ?? 0 });
    setStep(2);
  };

  const handleStep2 = (index: number) => {
    if (disabled) return;
    onChange({ step1: currentAnswer.step1, step2: index });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>
        <span className="text-sm font-medium text-zinc-600">
          Шаг {step} из 2
        </span>
      </div>

      {/* Шаг 1 */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 mb-4">
            <p className="text-base sm:text-lg font-medium text-zinc-900">{question.step1.question}</p>
          </div>
          <div className="space-y-2">
            {question.step1.options.map((opt, optIdx) => {
              const selected = currentAnswer.step1 === optIdx;
              return (
                <label
                  key={optIdx}
                  className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 min-h-[44px] touch-manipulation ${
                    selected
                      ? "border-primary-500 bg-primary-50"
                      : "border-zinc-200 hover:border-primary-300 hover:bg-zinc-50"
                  } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <input
                    type="radio"
                    checked={selected}
                    disabled={disabled}
                    onChange={() => handleStep1(optIdx)}
                    className="hidden"
                  />
                  <div className="flex-shrink-0">
                    {selected ? (
                      <CheckCircle2 className="h-5 w-5 text-primary-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-zinc-600" />
                    )}
                  </div>
                  <span className="text-zinc-700 flex-1 text-base sm:text-sm">{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Шаг 2 */}
      {step === 2 && currentAnswer.step1 !== null && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Вы выбрали: <strong>{question.step1.options[currentAnswer.step1]}</strong>
            </p>
            <button
              onClick={() => setStep(1)}
              disabled={disabled}
              className="text-sm text-blue-600 hover:text-blue-800 mt-2 underline"
            >
              Изменить выбор
            </button>
          </div>
          <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 mb-4">
            <p className="text-base sm:text-lg font-medium text-zinc-900">{question.step2.question}</p>
          </div>
          <div className="space-y-2">
            {question.step2.options.map((opt, optIdx) => {
              const selected = currentAnswer.step2 === optIdx;
              return (
                <label
                  key={optIdx}
                  className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 min-h-[44px] touch-manipulation ${
                    selected
                      ? "border-primary-500 bg-primary-50"
                      : "border-zinc-200 hover:border-primary-300 hover:bg-zinc-50"
                  } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <input
                    type="radio"
                    checked={selected}
                    disabled={disabled}
                    onChange={() => handleStep2(optIdx)}
                    className="hidden"
                  />
                  <div className="flex-shrink-0">
                    {selected ? (
                      <CheckCircle2 className="h-5 w-5 text-primary-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-zinc-600" />
                    )}
                  </div>
                  <span className="text-zinc-700 flex-1 text-base sm:text-sm">{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
