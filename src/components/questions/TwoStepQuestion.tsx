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
      {/* Улучшенный визуальный степпер */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-zinc-700">Прогресс ответа</span>
          <span className="text-sm font-bold text-primary-600">Шаг {step} из 2</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Шаг 1 */}
          <div className="flex items-center gap-2 flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
              step >= 1 
                ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg" 
                : "bg-zinc-200 text-zinc-500"
            }`}>
              {step > 1 ? "✓" : "1"}
            </div>
            <div className="flex-1">
              <div className="text-xs text-zinc-600 mb-1">Основной вопрос</div>
              <div className={`h-2 rounded-full ${
                step >= 1 ? "bg-gradient-to-r from-primary-500 to-primary-600" : "bg-zinc-200"
              }`} />
            </div>
          </div>

          {/* Разделитель */}
          <div className="text-2xl text-zinc-400">→</div>

          {/* Шаг 2 */}
          <div className="flex items-center gap-2 flex-1">
            <div className="flex-1">
              <div className="text-xs text-zinc-600 mb-1">Объяснение</div>
              <div className={`h-2 rounded-full ${
                step >= 2 ? "bg-gradient-to-r from-accent-500 to-accent-600" : "bg-zinc-200"
              }`} />
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
              step >= 2 
                ? "bg-gradient-to-br from-accent-500 to-accent-600 text-white shadow-lg" 
                : "bg-zinc-200 text-zinc-500"
            }`}>
              {step >= 2 ? "✓" : "2"}
            </div>
          </div>
        </div>
      </div>

      {/* Шаг 1 */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-300 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-primary-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Основной вопрос</span>
            </div>
            <p className="text-base sm:text-lg font-semibold text-zinc-900">{question.step1.question}</p>
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
                  <span className="text-zinc-700 flex-1 text-base sm:text-sm break-words leading-relaxed">{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Шаг 2 */}
      {step === 2 && currentAnswer.step1 !== null && (
        <div className="space-y-4">
          {/* Sticky-панель с выбором шага 1 */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl sticky top-4 z-10 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                  <span className="text-xs font-bold text-green-700 uppercase tracking-wide">
                    Ваш ответ на шаге 1
                  </span>
                </div>
                <p className="text-sm font-semibold text-zinc-900">
                  {question.step1.options[currentAnswer.step1]}
                </p>
              </div>
              {!disabled && (
                <button
                  onClick={() => setStep(1)}
                  className="flex-shrink-0 text-sm font-medium text-green-700 hover:text-green-800 bg-white border-2 border-green-500 hover:bg-green-50 px-3 py-2 rounded-lg transition-all"
                >
                  ← Изменить
                </button>
              )}
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-300 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-accent-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span className="text-xs font-medium text-purple-700 uppercase tracking-wide">Выберите объяснение</span>
            </div>
            <p className="text-base sm:text-lg font-semibold text-zinc-900">{question.step2.question}</p>
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
                  <span className="text-zinc-700 flex-1 text-base sm:text-sm break-words leading-relaxed">{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
