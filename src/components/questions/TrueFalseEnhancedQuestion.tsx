"use client";

import { useState } from "react";
import { CheckCircle2, Circle, X } from "lucide-react";
import type { TrueFalseEnhancedQuestion as TrueFalseEnhancedQuestionType, QuestionAnswer } from "@/tests/types";
import { MobileOptimizedButton } from "./shared/MobileOptimizedButton";

interface TrueFalseEnhancedQuestionProps {
  question: TrueFalseEnhancedQuestionType;
  answer: QuestionAnswer | null;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

export function TrueFalseEnhancedQuestion({
  question,
  answer,
  onChange,
  disabled = false,
}: TrueFalseEnhancedQuestionProps) {
  const currentAnswer = (answer as { answer: boolean; reason: number } | null) || {
    answer: null as any,
    reason: null as any,
  };
  const [step, setStep] = useState<1 | 2>(currentAnswer.answer === null ? 1 : 2);

  const handleAnswer = (value: boolean) => {
    if (disabled) return;
    onChange({ answer: value, reason: currentAnswer.reason ?? 0 });
    setStep(2);
  };

  const handleReason = (reasonIndex: number) => {
    if (disabled) return;
    onChange({ answer: currentAnswer.answer, reason: reasonIndex });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-zinc-600 mb-4">
        Шаг {step} из 2
      </div>

      {/* Шаг 1: Верно/Неверно */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 mb-4">
            <p className="text-base sm:text-lg font-medium text-zinc-900">{question.statement}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleAnswer(true)}
              disabled={disabled}
              className={`min-h-[60px] sm:min-h-[80px] rounded-lg border-2 flex flex-col items-center justify-center gap-2 touch-manipulation ${
                currentAnswer.answer === true
                  ? "border-green-500 bg-green-50"
                  : "border-zinc-300 bg-white hover:border-green-400"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <span className="font-semibold text-base sm:text-lg">Верно</span>
            </button>
            <button
              onClick={() => handleAnswer(false)}
              disabled={disabled}
              className={`min-h-[60px] sm:min-h-[80px] rounded-lg border-2 flex flex-col items-center justify-center gap-2 touch-manipulation ${
                currentAnswer.answer === false
                  ? "border-red-500 bg-red-50"
                  : "border-zinc-300 bg-white hover:border-red-400"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <X className="h-8 w-8 text-red-600" />
              <span className="font-semibold text-base sm:text-lg">Неверно</span>
            </button>
          </div>
        </div>
      )}

      {/* Шаг 2: Выбор причины */}
      {step === 2 && currentAnswer.answer !== null && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Вы выбрали: <strong>{currentAnswer.answer ? "Верно" : "Неверно"}</strong>
            </p>
            <button
              onClick={() => setStep(1)}
              disabled={disabled}
              className="text-sm text-blue-600 hover:text-blue-800 mt-2 underline"
            >
              Изменить ответ
            </button>
          </div>
          <div>
            <p className="font-medium mb-3 text-zinc-900">Выберите причину:</p>
            <div className="space-y-2">
              {question.reasons.map((reason, idx) => {
                const selected = currentAnswer.reason === idx;
                return (
                  <label
                    key={idx}
                    className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 min-h-[44px] touch-manipulation ${
                      selected
                        ? "border-primary-500 bg-primary-50"
                        : "border-zinc-200 bg-white hover:border-primary-300"
                    } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <input
                      type="radio"
                      checked={selected}
                      disabled={disabled}
                      onChange={() => handleReason(idx)}
                      className="hidden"
                    />
                    <div className="flex-shrink-0">
                      {selected ? (
                        <Circle className="h-5 w-5 text-primary-600 fill-primary-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-zinc-600" />
                      )}
                    </div>
                    <span className="text-zinc-700 flex-1 text-base sm:text-sm">{reason}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
