"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import type { OrderingQuestion as OrderingQuestionType, QuestionAnswer } from "@/tests/types";
import { MobileOptimizedButton } from "./shared/MobileOptimizedButton";

interface OrderingQuestionProps {
  question: OrderingQuestionType;
  answer: QuestionAnswer | null;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

export function OrderingQuestion({
  question,
  answer,
  onChange,
  disabled = false,
}: OrderingQuestionProps) {
  const order = (answer as number[] | null) || question.items.map((_, i) => i);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const moveUp = (index: number) => {
    if (disabled || index === 0) return;
    const newOrder = [...order];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onChange(newOrder);
  };

  const moveDown = (index: number) => {
    if (disabled || index === order.length - 1) return;
    const newOrder = [...order];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onChange(newOrder);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (disabled) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (disabled) return;
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (disabled || draggedIndex === null) return;
    e.preventDefault();
    
    const newOrder = [...order];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    onChange(newOrder);
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-4">
      {question.instruction && (
        <div className="text-sm font-medium text-zinc-700 mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          ℹ️ {question.instruction}
        </div>
      )}
      
      {/* Адаптивная подсказка */}
      <div className="p-3 rounded-lg border-2">
        <div className="hidden md:block text-sm font-medium text-indigo-700 bg-indigo-50 border-indigo-300 p-2 rounded">
          🖱️ <span className="font-bold">Десктоп:</span> Перетаскивайте элементы мышью
        </div>
        <div className="block md:hidden text-sm font-medium text-purple-700 bg-purple-50 border-purple-300 p-2 rounded">
          👆 <span className="font-bold">Мобильный:</span> Используйте кнопки со стрелками ↑ ↓ справа
        </div>
      </div>
      <div className="space-y-2">
        {order.map((itemIndex, displayIndex) => {
          const item = question.items[itemIndex];
          const isExtra = question.extraItems?.includes(itemIndex);
          const isDragging = draggedIndex === displayIndex;
          const isDragOver = dragOverIndex === displayIndex;
          
          return (
            <div
              key={itemIndex}
              draggable={!disabled && !isExtra}
              onDragStart={(e) => handleDragStart(e, displayIndex)}
              onDragOver={(e) => handleDragOver(e, displayIndex)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, displayIndex)}
              className={`flex items-center gap-3 p-3 sm:p-4 rounded-lg border-2 min-h-[44px] transition-all ${
                isDragging
                  ? "opacity-50 scale-95 border-primary-400 bg-primary-50"
                  : isDragOver
                  ? "border-primary-500 bg-primary-50 scale-[1.02]"
                  : isExtra
                  ? "border-amber-300 bg-amber-50"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              } ${!disabled && !isExtra ? "md:cursor-move" : ""}`}
            >
              {!disabled && !isExtra && (
                <div className="flex-shrink-0 text-zinc-400 hover:text-zinc-600 cursor-grab active:cursor-grabbing hidden md:block">
                  <GripVertical className="h-5 w-5" />
                </div>
              )}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                {displayIndex + 1}
              </div>
              <div className="flex-1 text-base sm:text-sm text-zinc-700">{item}</div>
              {isExtra && (
                <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded font-medium">
                  Лишний
                </span>
              )}
              {/* УЛУЧШЕННЫЕ кнопки - особенно для мобильных */}
              <div className="flex md:flex-col gap-2 md:gap-1">
                <button
                  onClick={() => moveUp(displayIndex)}
                  disabled={disabled || displayIndex === 0}
                  className={`p-2 rounded-lg border-2 touch-manipulation min-h-[44px] min-w-[44px] md:min-h-[36px] md:min-w-[36px] flex items-center justify-center transition-all ${
                    disabled || displayIndex === 0
                      ? "opacity-30 cursor-not-allowed border-zinc-200 bg-zinc-50"
                      : "border-primary-400 bg-primary-50 hover:bg-primary-100 active:scale-95 cursor-pointer"
                  }`}
                  aria-label="Переместить вверх"
                  title="Переместить вверх"
                >
                  <ArrowUp className="h-5 w-5 md:h-4 md:w-4 text-primary-700" />
                </button>
                <button
                  onClick={() => moveDown(displayIndex)}
                  disabled={disabled || displayIndex === order.length - 1}
                  className={`p-2 rounded-lg border-2 touch-manipulation min-h-[44px] min-w-[44px] md:min-h-[36px] md:min-w-[36px] flex items-center justify-center transition-all ${
                    disabled || displayIndex === order.length - 1
                      ? "opacity-30 cursor-not-allowed border-zinc-200 bg-zinc-50"
                      : "border-accent-400 bg-accent-50 hover:bg-accent-100 active:scale-95 cursor-pointer"
                  }`}
                  aria-label="Переместить вниз"
                  title="Переместить вниз"
                >
                  <ArrowDown className="h-5 w-5 md:h-4 md:w-4 text-accent-700" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
