"use client";

import { useState } from "react";
import type { MatchingQuestion as MatchingQuestionType, QuestionAnswer } from "@/tests/types";
import { MobileOptimizedButton } from "./shared/MobileOptimizedButton";

interface MatchingQuestionProps {
  question: MatchingQuestionType;
  answer: QuestionAnswer | null;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

export function MatchingQuestion({
  question,
  answer,
  onChange,
  disabled = false,
}: MatchingQuestionProps) {
  const pairs = (answer as [number, number][] | null) || [];
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);

  const handleLeftClick = (leftIndex: number) => {
    if (disabled) return;
    setSelectedLeft(leftIndex);
  };

  const handleRightClick = (rightIndex: number) => {
    if (disabled || selectedLeft === null) return;

    const newPairs = pairs.filter(([l]) => l !== selectedLeft);
    newPairs.push([selectedLeft, rightIndex]);
    onChange(newPairs);
    setSelectedLeft(null);
  };

  const removePair = (leftIndex: number) => {
    if (disabled) return;
    const newPairs = pairs.filter(([l]) => l !== leftIndex);
    onChange(newPairs);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-zinc-600 mb-4">
        {question.variant === "1-to-1" && "Соедините каждый термин с соответствующим определением"}
        {question.variant === "1-to-many" && "Соедините термины с примерами (одному термину может соответствовать несколько)"}
        {question.variant === "extra-right" && "Соедините термины с определениями (один вариант справа не используется)"}
        {question.variant === "three-columns" && "Соедините термин → определение → пример"}
      </div>

      {/* Мобильная версия: вертикальная компоновка */}
      <div className="block sm:hidden space-y-6">
        <div>
          <h3 className="font-semibold mb-3 text-zinc-900">Левая колонка:</h3>
          <div className="space-y-2">
            {question.leftItems.map((item, idx) => {
              const pair = pairs.find(([l]) => l === idx);
              const isSelected = selectedLeft === idx;
              return (
                <div key={idx} className="flex items-center gap-2">
                  <button
                    onClick={() => handleLeftClick(idx)}
                    disabled={disabled}
                    className={`flex-1 min-h-[44px] px-4 py-3 rounded-lg border-2 text-left touch-manipulation ${
                      isSelected
                        ? "border-primary-600 bg-primary-50"
                        : pair
                        ? "border-green-500 bg-green-50"
                        : "border-zinc-300 bg-white hover:border-primary-300"
                    } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {item}
                  </button>
                  {pair && (
                    <button
                      onClick={() => removePair(idx)}
                      disabled={disabled}
                      className="text-red-600 hover:text-red-700 min-h-[44px] px-3"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-zinc-900">Правая колонка:</h3>
          <div className="space-y-2">
            {question.rightItems.map((item, idx) => {
              const isUsed = pairs.some(([, r]) => r === idx);
              const isSelected = selectedLeft !== null;
              return (
                <button
                  key={idx}
                  onClick={() => handleRightClick(idx)}
                  disabled={disabled || !isSelected || isUsed}
                  className={`w-full min-h-[44px] px-4 py-3 rounded-lg border-2 text-left touch-manipulation ${
                    isUsed
                      ? "border-green-500 bg-green-50 opacity-60"
                      : isSelected
                      ? "border-primary-300 bg-primary-50 hover:border-primary-500"
                      : "border-zinc-300 bg-white"
                  } ${disabled || !isSelected || isUsed ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Десктопная версия: две колонки */}
      <div className="hidden sm:grid sm:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-3 text-zinc-900">Левая колонка:</h3>
          <div className="space-y-2">
            {question.leftItems.map((item, idx) => {
              const pair = pairs.find(([l]) => l === idx);
              const isSelected = selectedLeft === idx;
              return (
                <div key={idx} className="flex items-center gap-2">
                  <button
                    onClick={() => handleLeftClick(idx)}
                    disabled={disabled}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 text-left ${
                      isSelected
                        ? "border-primary-600 bg-primary-50"
                        : pair
                        ? "border-green-500 bg-green-50"
                        : "border-zinc-300 bg-white hover:border-primary-300"
                    } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {item}
                  </button>
                  {pair && (
                    <button
                      onClick={() => removePair(idx)}
                      disabled={disabled}
                      className="text-red-600 hover:text-red-700 px-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-zinc-900">Правая колонка:</h3>
          <div className="space-y-2">
            {question.rightItems.map((item, idx) => {
              const isUsed = pairs.some(([, r]) => r === idx);
              const isSelected = selectedLeft !== null;
              return (
                <button
                  key={idx}
                  onClick={() => handleRightClick(idx)}
                  disabled={disabled || !isSelected || isUsed}
                  className={`w-full px-4 py-3 rounded-lg border-2 text-left ${
                    isUsed
                      ? "border-green-500 bg-green-50 opacity-60"
                      : isSelected
                      ? "border-primary-300 bg-primary-50 hover:border-primary-500"
                      : "border-zinc-300 bg-white"
                  } ${disabled || !isSelected || isUsed ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedLeft !== null && (
        <div className="text-sm text-primary-600 mt-2">
          Выберите элемент справа для соединения
        </div>
      )}
    </div>
  );
}
