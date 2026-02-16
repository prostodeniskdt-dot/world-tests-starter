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
  const hasReasons = (question.reasons?.length ?? 0) > 0;
  const [step, setStep] = useState<1 | 2>(
    currentAnswer.answer === null || !hasReasons ? 1 : 2
  );

  const handleAnswer = (value: boolean) => {
    if (disabled) return;
    onChange({ answer: value, reason: 0 });
    if (question.reasons?.length) setStep(2);
  };

  const handleReason = (reasonIndex: number) => {
    if (disabled) return;
    onChange({ answer: currentAnswer.answer, reason: reasonIndex });
  };

  return (
    <div className="space-y-4">

      {/* Шаг 1: Верно/Неверно */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-zinc-200 bg-white mb-4">
            <p className="text-base font-medium text-zinc-900 leading-relaxed">{question.statement}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleAnswer(true)}
              disabled={disabled}
              className={`min-h-[80px] sm:min-h-[100px] rounded-xl border-3 flex flex-col items-center justify-center gap-3 touch-manipulation transition-all ${
                currentAnswer.answer === true
                  ? "border-green-600 bg-gradient-to-br from-green-50 to-green-100 shadow-lg scale-105 ring-2 ring-green-300"
                  : "border-zinc-300 bg-white hover:border-green-400 hover:bg-green-50 hover:scale-102"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <CheckCircle2 className={`h-8 w-8 sm:h-10 sm:w-10 ${
                currentAnswer.answer === true ? "text-green-600" : "text-green-500"
              }`} />
              <span className={`font-bold text-base sm:text-lg ${
                currentAnswer.answer === true ? "text-green-700" : "text-zinc-700"
              }`}>
                ✓ Верно
              </span>
            </button>
            <button
              onClick={() => handleAnswer(false)}
              disabled={disabled}
              className={`min-h-[70px] sm:min-h-[80px] rounded-xl border-3 flex flex-col items-center justify-center gap-2 touch-manipulation transition-all ${
                currentAnswer.answer === false
                  ? "border-red-600 bg-gradient-to-br from-red-50 to-red-100 shadow-lg scale-105 ring-2 ring-red-300"
                  : "border-zinc-300 bg-white hover:border-red-400 hover:bg-red-50 hover:scale-102"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <X className={`h-8 w-8 sm:h-10 sm:w-10 ${
                currentAnswer.answer === false ? "text-red-600" : "text-red-500"
              }`} />
              <span className={`font-bold text-base sm:text-lg ${
                currentAnswer.answer === false ? "text-red-700" : "text-zinc-700"
              }`}>
                ✗ Неверно
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Шаг 2: Выбор причины (только если есть варианты причин) */}
      {step === 2 && currentAnswer.answer !== null && question.reasons?.length > 0 && (
        <div className="space-y-4">
          <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-700">
                Ваш ответ: {currentAnswer.answer ? "Верно" : "Неверно"}
              </p>
              {!disabled && (
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-zinc-600 hover:text-zinc-900 underline"
                >
                  Изменить
                </button>
              )}
            </div>
          </div>
          <div>
            <p className="font-medium mb-3 text-zinc-900 text-sm">
              Выберите объяснение:
            </p>
            <div className="space-y-2">
              {question.reasons.map((reason, idx) => {
                const selected = currentAnswer.reason === idx;
                return (
                  <label
                    key={idx}
                    className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 min-h-[44px] touch-manipulation transition-all ${
                      selected
                        ? "border-primary-600 bg-gradient-to-r from-primary-50 to-accent-50 shadow-lg ring-2 ring-primary-300"
                        : "border-zinc-300 bg-white hover:border-primary-400 hover:bg-primary-50"
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
                        <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <Circle className="h-6 w-6 text-zinc-400" />
                      )}
                    </div>
                    <span className={`flex-1 text-base sm:text-sm break-words leading-relaxed ${
                      selected ? "font-medium text-zinc-900" : "text-zinc-700"
                    }`}>
                      {reason}
                    </span>
                    {selected && (
                      <span className="flex-shrink-0 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded">
                        ✓
                      </span>
                    )}
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
