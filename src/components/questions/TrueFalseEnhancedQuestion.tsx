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
      {/* Инструкция */}
      <div className="text-xs sm:text-sm font-medium text-zinc-700 mb-3 p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
        ℹ️ Сначала выберите &quot;Верно&quot; или &quot;Неверно&quot;, затем укажите причину
      </div>
      
      {/* Улучшенный степпер с прогрессом */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-medium text-zinc-700">Прогресс ответа</span>
          <span className="text-xs sm:text-sm font-bold text-primary-600">Шаг {step} из 2</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex-1 h-3 rounded-full transition-all ${
            step >= 1 ? "bg-gradient-to-r from-primary-500 to-primary-600" : "bg-zinc-200"
          }`}>
            <div className="flex items-center justify-center h-full text-white text-xs font-bold">
              {step >= 1 && "✓"}
            </div>
          </div>
          <div className={`flex-1 h-3 rounded-full transition-all ${
            step >= 2 ? "bg-gradient-to-r from-accent-500 to-accent-600" : "bg-zinc-200"
          }`}>
            <div className="flex items-center justify-center h-full text-white text-xs font-bold">
              {step >= 2 && "✓"}
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-zinc-500">Утверждение</span>
          <span className="text-xs text-zinc-500">Объяснение</span>
        </div>
      </div>

      {/* Шаг 1: Верно/Неверно */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-300 mb-3 sm:mb-4">
            <p className="text-sm sm:text-base md:text-lg font-semibold text-zinc-900 leading-snug">{question.statement}</p>
          </div>
          <div className="text-xs sm:text-sm font-medium text-zinc-700 mb-3 text-center">
            Это утверждение верно или неверно?
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

      {/* Шаг 2: Выбор причины */}
      {step === 2 && currentAnswer.answer !== null && (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border-2 ${
            currentAnswer.answer 
              ? "bg-gradient-to-r from-green-50 to-green-100 border-green-400" 
              : "bg-gradient-to-r from-red-50 to-red-100 border-red-400"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 mb-1">Ваш ответ на шаге 1:</p>
                <p className={`text-lg font-bold flex items-center gap-2 ${
                  currentAnswer.answer ? "text-green-700" : "text-red-700"
                }`}>
                  {currentAnswer.answer ? (
                    <><CheckCircle2 className="h-5 w-5" /> Верно</>
                  ) : (
                    <><X className="h-5 w-5" /> Неверно</>
                  )}
                </p>
              </div>
              {!disabled && (
                <button
                  onClick={() => setStep(1)}
                  className={`text-sm font-medium px-4 py-2 rounded-lg border-2 transition-colors ${
                    currentAnswer.answer
                      ? "border-green-600 text-green-700 hover:bg-green-200"
                      : "border-red-600 text-red-700 hover:bg-red-200"
                  }`}
                >
                  ← Изменить
                </button>
              )}
            </div>
          </div>
          <div>
            <p className="font-semibold mb-3 text-zinc-900 text-base">
              💡 Теперь выберите объяснение вашего ответа:
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
