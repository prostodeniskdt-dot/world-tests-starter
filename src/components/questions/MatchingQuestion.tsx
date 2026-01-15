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

  // Получаем сопоставленный элемент справа для отображения
  const getRightItemForLeft = (leftIndex: number) => {
    const pair = pairs.find(([l]) => l === leftIndex);
    return pair ? pair[1] : null;
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-zinc-700 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        {question.variant === "1-to-1" && "Соедините каждый термин с соответствующим определением"}
        {question.variant === "1-to-many" && "Соедините термины с примерами (одному термину может соответствовать несколько)"}
        {question.variant === "extra-right" && "Соедините термины с определениями (один вариант справа не используется)"}
        {question.variant === "three-columns" && "Соедините термин → определение → пример"}
      </div>
      
      {/* Показываем созданные пары */}
      {pairs.length > 0 && (
        <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2 text-sm">Созданные соединения ({pairs.length}):</h4>
          <div className="space-y-2">
            {pairs.map(([leftIdx, rightIdx], pairIdx) => (
              <div key={pairIdx} className="flex items-center gap-3 p-2 bg-white rounded border border-green-200">
                <div className="flex-1 text-sm text-zinc-700">
                  <span className="font-medium text-primary-600">{leftIdx + 1}.</span> {question.leftItems[leftIdx]}
                </div>
                <div className="flex-shrink-0 text-green-600 font-bold text-lg">→</div>
                <div className="flex-1 text-sm text-zinc-700">
                  <span className="font-medium text-accent-600">{String.fromCharCode(65 + rightIdx)}.</span> {question.rightItems[rightIdx]}
                </div>
                <button
                  onClick={() => removePair(leftIdx)}
                  disabled={disabled}
                  className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded px-2 py-1 transition-colors disabled:opacity-50"
                  title="Удалить связь"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Мобильная версия: вертикальная компоновка */}
      <div className="block sm:hidden space-y-6">
        <div>
          <h3 className="font-semibold mb-3 text-zinc-900 flex items-center gap-2">
            <span className="bg-primary-100 text-primary-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
            Выберите элемент слева:
          </h3>
          <div className="space-y-2">
            {question.leftItems.map((item, idx) => {
              const rightIdx = getRightItemForLeft(idx);
              const isSelected = selectedLeft === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleLeftClick(idx)}
                  disabled={disabled}
                  className={`w-full min-h-[44px] px-4 py-3 rounded-lg border-2 text-left touch-manipulation transition-all ${
                    isSelected
                      ? "border-primary-600 bg-primary-100 ring-2 ring-primary-300"
                      : rightIdx !== null
                      ? "border-green-500 bg-green-50"
                      : "border-zinc-300 bg-white hover:border-primary-300"
                  } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary-600">{idx + 1}.</span>
                      <span>{item}</span>
                    </div>
                    {rightIdx !== null && (
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded font-medium">
                        → {String.fromCharCode(65 + rightIdx)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-zinc-900 flex items-center gap-2">
            <span className="bg-accent-100 text-accent-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
            Затем выберите соответствие справа:
          </h3>
          <div className="space-y-2">
            {question.rightItems.map((item, idx) => {
              const isUsed = pairs.some(([, r]) => r === idx);
              const isSelected = selectedLeft !== null;
              return (
                <button
                  key={idx}
                  onClick={() => handleRightClick(idx)}
                  disabled={disabled || !isSelected || isUsed}
                  className={`w-full min-h-[44px] px-4 py-3 rounded-lg border-2 text-left touch-manipulation transition-all ${
                    isUsed
                      ? "border-green-500 bg-green-50 opacity-60"
                      : isSelected
                      ? "border-accent-400 bg-accent-50 hover:border-accent-500 hover:bg-accent-100"
                      : "border-zinc-300 bg-zinc-50 opacity-50"
                  } ${disabled || !isSelected || isUsed ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-accent-600">{String.fromCharCode(65 + idx)}.</span>
                    <span>{item}</span>
                    {isUsed && <span className="ml-auto text-xs bg-green-600 text-white px-2 py-1 rounded">✓ Используется</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Десктопная версия: две колонки */}
      <div className="hidden sm:grid sm:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-3 text-zinc-900 flex items-center gap-2">
            <span className="bg-primary-100 text-primary-700 w-7 h-7 rounded-full flex items-center justify-center text-sm">1</span>
            Левая колонка
          </h3>
          <div className="space-y-2">
            {question.leftItems.map((item, idx) => {
              const rightIdx = getRightItemForLeft(idx);
              const isSelected = selectedLeft === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleLeftClick(idx)}
                  disabled={disabled}
                  className={`w-full px-4 py-3 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? "border-primary-600 bg-primary-100 ring-2 ring-primary-300"
                      : rightIdx !== null
                      ? "border-green-500 bg-green-50"
                      : "border-zinc-300 bg-white hover:border-primary-300"
                  } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary-600 min-w-[24px]">{idx + 1}.</span>
                      <span className="text-sm">{item}</span>
                    </div>
                    {rightIdx !== null && (
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded font-medium whitespace-nowrap">
                        → {String.fromCharCode(65 + rightIdx)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-zinc-900 flex items-center gap-2">
            <span className="bg-accent-100 text-accent-700 w-7 h-7 rounded-full flex items-center justify-center text-sm">2</span>
            Правая колонка
          </h3>
          <div className="space-y-2">
            {question.rightItems.map((item, idx) => {
              const isUsed = pairs.some(([, r]) => r === idx);
              const isSelected = selectedLeft !== null;
              return (
                <button
                  key={idx}
                  onClick={() => handleRightClick(idx)}
                  disabled={disabled || !isSelected || isUsed}
                  className={`w-full px-4 py-3 rounded-lg border-2 text-left transition-all ${
                    isUsed
                      ? "border-green-500 bg-green-50 opacity-60"
                      : isSelected
                      ? "border-accent-400 bg-accent-50 hover:border-accent-500 hover:bg-accent-100"
                      : "border-zinc-300 bg-zinc-50 opacity-50"
                  } ${disabled || !isSelected || isUsed ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-accent-600 min-w-[28px]">{String.fromCharCode(65 + idx)}.</span>
                    <span className="text-sm flex-1">{item}</span>
                    {isUsed && <span className="text-xs bg-green-600 text-white px-2 py-1 rounded whitespace-nowrap">✓ Используется</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedLeft !== null && (
        <div className="text-sm font-medium text-primary-700 mt-2 p-3 bg-primary-50 border border-primary-200 rounded-lg animate-pulse">
          ℹ️ Теперь выберите элемент справа для создания соединения с &ldquo;{question.leftItems[selectedLeft]}&rdquo;
        </div>
      )}
    </div>
  );
}
