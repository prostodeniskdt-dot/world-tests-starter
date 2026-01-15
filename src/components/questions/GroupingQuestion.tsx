"use client";

import { useState } from "react";
import type { GroupingQuestion as GroupingQuestionType, QuestionAnswer } from "@/tests/types";
import { TouchFriendlyInput } from "./shared/TouchFriendlyInput";
import { GripVertical, CheckCircle2 } from "lucide-react";

interface GroupingQuestionProps {
  question: GroupingQuestionType;
  answer: QuestionAnswer | null;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

const CATEGORY_COLORS = [
  { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", badge: "bg-blue-600" },
  { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700", badge: "bg-purple-600" },
  { bg: "bg-green-50", border: "border-green-300", text: "text-green-700", badge: "bg-green-600" },
  { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", badge: "bg-orange-600" },
  { bg: "bg-pink-50", border: "border-pink-300", text: "text-pink-700", badge: "bg-pink-600" },
];

export function GroupingQuestion({
  question,
  answer,
  onChange,
  disabled = false,
}: GroupingQuestionProps) {
  const groups = (answer as Record<string, number[]> | null) || {};
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);

  const toggleItemInCategory = (itemIndex: number, category: string) => {
    if (disabled) return;
    const categoryItems = groups[category] || [];
    const newCategoryItems = categoryItems.includes(itemIndex)
      ? categoryItems.filter((i) => i !== itemIndex)
      : [...categoryItems, itemIndex];
    
    onChange({
      ...groups,
      [category]: newCategoryItems,
    });
  };

  const getCategoryColor = (index: number) => CATEGORY_COLORS[index % CATEGORY_COLORS.length];

  const getItemCategories = (itemIndex: number) => {
    return Object.keys(groups).filter((cat) => groups[cat]?.includes(itemIndex));
  };

  const isItemPlaced = (itemIndex: number) => {
    return Object.values(groups).some(items => items?.includes(itemIndex));
  };

  const handleDragStart = (e: React.DragEvent, itemIndex: number) => {
    if (disabled) return;
    setDraggedItem(itemIndex);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, category: string) => {
    if (disabled) return;
    e.preventDefault();
    setDragOverCategory(category);
  };

  const handleDrop = (e: React.DragEvent, category: string) => {
    if (disabled || draggedItem === null) return;
    e.preventDefault();
    
    toggleItemInCategory(draggedItem, category);
    setDraggedItem(null);
    setDragOverCategory(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverCategory(null);
  };

  const unplacedItems = question.items.filter((_, idx) => !isItemPlaced(idx));
  const totalPlaced = question.items.length - unplacedItems.length;

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-zinc-700 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        📦 Распределите элементы по категориям
        {question.allowMultiple && " (элемент может быть в нескольких категориях)"}
      </div>

      {/* Прогресс */}
      <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600">Распределено элементов:</span>
          <span className="font-bold text-primary-600">{totalPlaced} / {question.items.length}</span>
        </div>
        <div className="mt-2 w-full bg-zinc-200 rounded-full h-2">
          <div 
            className="gradient-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${(totalPlaced / question.items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Неразмещенные элементы - ТОЛЬКО НА ДЕСКТОПЕ для drag & drop */}
      {unplacedItems.length > 0 && (
        <div className="hidden md:block p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
          <h4 className="font-semibold text-amber-900 mb-3 text-sm flex items-center gap-2">
            <span className="bg-amber-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
              {unplacedItems.length}
            </span>
            Элементы для распределения (перетащите в категорию):
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {question.items.map((item, itemIndex) => {
              if (isItemPlaced(itemIndex)) return null;
              return (
                <div
                  key={itemIndex}
                  draggable={!disabled}
                  onDragStart={(e) => handleDragStart(e, itemIndex)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2 p-3 bg-white border-2 border-amber-400 rounded-lg min-h-[44px] transition-all ${
                    draggedItem === itemIndex ? "opacity-50 scale-95" : ""
                  } ${!disabled ? "cursor-move hover:border-amber-500 hover:shadow-md" : "cursor-not-allowed opacity-60"}`}
                >
                  {!disabled && (
                    <GripVertical className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  )}
                  <span className="flex-1 font-medium text-zinc-700">{item}</span>
                  <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
                    Перетащите мышью →
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Категории как визуальные корзины - ТОЛЬКО ДЕСКТОП */}
      <div className="hidden md:grid md:grid-cols-2 gap-4">
        {question.categories.map((category, catIdx) => {
          const categoryItems = groups[category] || [];
          const color = getCategoryColor(catIdx);
          const isDragOver = dragOverCategory === category;
          
          return (
            <div
              key={category}
              onDragOver={(e) => handleDragOver(e, category)}
              onDrop={(e) => handleDrop(e, category)}
              className={`border-2 rounded-lg p-4 transition-all min-h-[150px] ${color.bg} ${color.border} ${
                isDragOver ? "ring-2 ring-primary-400 scale-[1.02]" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-bold ${color.text} text-sm sm:text-base`}>{category}</h3>
                <span className={`${color.badge} text-white text-xs font-bold px-2 py-1 rounded-full`}>
                  {categoryItems.length}
                </span>
              </div>
              
              <div className="space-y-2 min-h-[80px]">
                {categoryItems.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400 text-sm border-2 border-dashed border-zinc-300 rounded-lg">
                    Перетащите элементы сюда
                  </div>
                ) : (
                  categoryItems.map((itemIndex) => (
                    <div
                      key={itemIndex}
                      className="flex items-center justify-between gap-2 p-2 bg-white border border-zinc-300 rounded-lg min-h-[40px] group transition-all hover:shadow-md"
                    >
                      <span className="text-sm text-zinc-700 flex-1">{question.items[itemIndex]}</span>
                      {!disabled && (
                        <button
                          onClick={() => toggleItemInCategory(itemIndex, category)}
                          className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 hover:bg-red-50 rounded px-2 py-1 transition-all text-xs"
                          title="Удалить из категории"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Мобильная версия: УЛУЧШЕННЫЕ кнопки для категорий */}
      <div className="block md:hidden space-y-4">
        <div className="text-sm font-medium text-zinc-700 p-3 bg-indigo-50 border border-indigo-300 rounded-lg">
          👆 Нажмите на кнопки категорий под каждым элементом:
        </div>
        {question.items.map((item, itemIndex) => {
          const itemCats = getItemCategories(itemIndex);
          const isPlaced = itemCats.length > 0;
          
          return (
            <div 
              key={itemIndex} 
              className={`border-2 rounded-xl p-4 transition-all ${
                isPlaced 
                  ? "border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md" 
                  : "border-amber-400 bg-amber-50"
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isPlaced ? "bg-green-600 text-white" : "bg-amber-600 text-white"
                }`}>
                  {itemIndex + 1}
                </span>
                <div className="flex-1">
                  <div className="font-semibold text-zinc-900 text-base mb-1">{item}</div>
                  {isPlaced && (
                    <div className="text-xs text-green-700 font-medium">
                      ✓ Распределен в {itemCats.length} {itemCats.length === 1 ? "категорию" : "категории"}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="text-xs font-medium text-zinc-600 mb-1">
                  Выберите {question.allowMultiple ? "категории" : "категорию"}:
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {question.categories.map((cat, catIdx) => {
                    const isInCategory = itemCats.includes(cat);
                    const color = getCategoryColor(catIdx);
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleItemInCategory(itemIndex, cat)}
                        disabled={disabled}
                        className={`min-h-[48px] px-4 py-3 rounded-lg border-2 text-sm font-bold transition-all touch-manipulation ${
                          isInCategory
                            ? `${color.bg} ${color.border} ${color.text} shadow-lg ring-2 ring-offset-1`
                            : "bg-white border-zinc-300 text-zinc-700 hover:border-zinc-400 active:scale-95"
                        } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>{cat}</span>
                          {isInCategory && (
                            <span className={`${color.badge} text-white px-2 py-1 rounded text-xs`}>
                              ✓
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
