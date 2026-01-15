"use client";

import { useState } from "react";
import { CheckSquare, Square, ArrowUp, ArrowDown } from "lucide-react";
import type { ConstructQuestion as ConstructQuestionType, QuestionAnswer } from "@/tests/types";

interface ConstructQuestionProps {
  question: ConstructQuestionType;
  answer: QuestionAnswer | null;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

export function ConstructQuestion({
  question,
  answer,
  onChange,
  disabled = false,
}: ConstructQuestionProps) {
  const currentAnswer = (answer as { blocks: number[]; order: number[] } | null) || {
    blocks: [],
    order: [],
  };
  const [step, setStep] = useState<"select" | "order">(
    question.question === "selection-only"
      ? "select"
      : question.question === "order-only"
      ? "order"
      : currentAnswer.blocks.length === 0
      ? "select"
      : "order"
  );

  const toggleBlock = (blockIndex: number) => {
    if (disabled) return;
    const newBlocks = currentAnswer.blocks.includes(blockIndex)
      ? currentAnswer.blocks.filter((i) => i !== blockIndex)
      : [...currentAnswer.blocks, blockIndex];
    onChange({ ...currentAnswer, blocks: newBlocks });
  };

  const moveUp = (index: number) => {
    if (disabled || index === 0) return;
    const newOrder = [...currentAnswer.order];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onChange({ ...currentAnswer, order: newOrder });
  };

  const moveDown = (index: number) => {
    if (disabled || index === currentAnswer.order.length - 1) return;
    const newOrder = [...currentAnswer.order];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onChange({ ...currentAnswer, order: newOrder });
  };

  // Шаг 1: Выбор блоков
  if (step === "select" && question.question !== "order-only") {
    return (
      <div className="space-y-4">
        <div className="text-sm text-zinc-600 mb-4">
          Шаг 1: Выберите блоки, которые должны войти
        </div>
        <div className="space-y-2">
          {question.blocks.map((block, blockIdx) => {
            const isSelected = currentAnswer.blocks.includes(blockIdx);
            return (
              <label
                key={blockIdx}
                className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 min-h-[44px] touch-manipulation ${
                  isSelected
                    ? "border-primary-500 bg-primary-50"
                    : "border-zinc-200 hover:border-primary-300"
                } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={disabled}
                  onChange={() => toggleBlock(blockIdx)}
                  className="hidden"
                />
                <div className="flex-shrink-0">
                  {isSelected ? (
                    <CheckSquare className="h-5 w-5 text-primary-600" />
                  ) : (
                    <Square className="h-5 w-5 text-zinc-600" />
                  )}
                </div>
                <span className="text-zinc-700 flex-1 text-base sm:text-sm">{block}</span>
              </label>
            );
          })}
        </div>
        {question.question === "both" && currentAnswer.blocks.length > 0 && (
          <button
            onClick={() => {
              // Инициализируем порядок выбранными блоками
              onChange({ ...currentAnswer, order: [...currentAnswer.blocks] });
              setStep("order");
            }}
            disabled={disabled}
            className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 min-h-[44px] touch-manipulation"
          >
            Продолжить к упорядочиванию
          </button>
        )}
      </div>
    );
  }

  // Шаг 2: Упорядочивание
  if (step === "order" && question.question !== "selection-only") {
    const order = currentAnswer.order.length > 0 ? currentAnswer.order : currentAnswer.blocks;

    return (
      <div className="space-y-4">
        <div className="text-sm text-zinc-600 mb-4">
          {question.question === "both" ? "Шаг 2: " : ""}Расставьте блоки в правильном порядке
        </div>
        {question.question === "both" && (
          <button
            onClick={() => setStep("select")}
            disabled={disabled}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Изменить выбор блоков
          </button>
        )}
        <div className="space-y-2">
          {order.map((blockIndex, displayIndex) => {
            const block = question.blocks[blockIndex];
            return (
              <div
                key={blockIndex}
                className="flex items-center gap-2 p-3 sm:p-4 rounded-lg border-2 border-zinc-200 bg-white min-h-[44px]"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                  {displayIndex + 1}
                </div>
                <div className="flex-1 text-base sm:text-sm text-zinc-700">{block}</div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveUp(displayIndex)}
                    disabled={disabled || displayIndex === 0}
                    className="p-1 rounded hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[32px] min-w-[32px] flex items-center justify-center"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moveDown(displayIndex)}
                    disabled={disabled || displayIndex === order.length - 1}
                    className="p-1 rounded hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[32px] min-w-[32px] flex items-center justify-center"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
