"use client";

import { useState } from "react";
import type { GroupingQuestion as GroupingQuestionType, QuestionAnswer } from "@/tests/types";
import { TouchFriendlyInput } from "./shared/TouchFriendlyInput";

interface GroupingQuestionProps {
  question: GroupingQuestionType;
  answer: QuestionAnswer | null;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

export function GroupingQuestion({
  question,
  answer,
  onChange,
  disabled = false,
}: GroupingQuestionProps) {
  const groups = (answer as Record<string, number[]> | null) || {};
  const [selectedItem, setSelectedItem] = useState<number | null>(null);

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

  return (
    <div className="space-y-4">
      <div className="text-sm text-zinc-600 mb-4">
        Разнесите элементы по категориям
        {question.allowMultiple && " (элемент может быть в нескольких категориях)"}
      </div>

      {/* Мобильная версия: вертикальный список с выпадающими списками */}
      <div className="block sm:hidden space-y-4">
        {question.items.map((item, itemIndex) => {
          const itemCategories = Object.keys(groups).filter((cat) =>
            groups[cat]?.includes(itemIndex)
          );
          return (
            <div key={itemIndex} className="border border-zinc-200 rounded-lg p-3">
              <div className="font-medium mb-2 text-zinc-900">{item}</div>
              <select
                value={itemCategories[0] || ""}
                onChange={(e) => {
                  if (disabled) return;
                  const newGroups = { ...groups };
                  // Удаляем из всех категорий
                  Object.keys(newGroups).forEach((cat) => {
                    newGroups[cat] = newGroups[cat].filter((i) => i !== itemIndex);
                  });
                  // Добавляем в выбранную
                  if (e.target.value) {
                    newGroups[e.target.value] = [...(newGroups[e.target.value] || []), itemIndex];
                  }
                  onChange(newGroups);
                }}
                disabled={disabled}
                className="w-full min-h-[44px] text-base border border-zinc-300 rounded-lg px-3 py-2 touch-manipulation"
              >
                <option value="">Выберите категорию</option>
                {question.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {/* Десктопная версия: категории как вкладки */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.categories.map((category) => (
            <div key={category} className="border border-zinc-200 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-zinc-900">{category}</h3>
              <div className="space-y-2">
                {question.items.map((item, itemIndex) => {
                  const isInCategory = groups[category]?.includes(itemIndex);
                  return (
                    <label
                      key={itemIndex}
                      className={`flex items-center gap-2 p-2 rounded border-2 min-h-[44px] cursor-pointer ${
                        isInCategory
                          ? "border-primary-500 bg-primary-50"
                          : "border-zinc-200 bg-white hover:border-primary-300"
                      } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={isInCategory}
                        disabled={disabled}
                        onChange={() => toggleItemInCategory(itemIndex, category)}
                        className="hidden"
                      />
                      <span className="text-sm text-zinc-700">{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
