"use client";

import type { ClozeDropdownQuestion as ClozeDropdownQuestionType, QuestionAnswer } from "@/tests/types";

interface ClozeDropdownQuestionProps {
  question: ClozeDropdownQuestionType;
  answer: QuestionAnswer | null;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

export function ClozeDropdownQuestion({
  question,
  answer,
  onChange,
  disabled = false,
}: ClozeDropdownQuestionProps) {
  const selectedIndices = (answer as number[] | null) || question.gaps.map(() => -1);
  
  // Подсчет заполненных пропусков (-1 = не выбрано)
  const filledGaps = selectedIndices.filter(idx => idx >= 0).length;
  const totalGaps = question.gaps.length;

  const handleGapChange = (gapIndex: number, optionIndex: number) => {
    if (disabled) return;
    const newIndices = [...selectedIndices];
    newIndices[gapIndex] = optionIndex;
    onChange(newIndices);
  };

  // Разбиваем текст на части с пропусками
  const renderText = () => {
    let currentIndex = 0;
    const parts: React.ReactNode[] = [];
    const text = question.text;
    // Поддержка форматов: ___, {0}, [1], [1: ___] (все форматы с номерами или без)
    const gapPattern = /___|\[(\d+)(?::\s*___)?\]|\{(\d+)\}/g;
    let lastIndex = 0;
    let match;

    while ((match = gapPattern.exec(text)) !== null) {
      // Текст до пропуска
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>{text.substring(lastIndex, match.index)}</span>
        );
      }

      // Пропуск - извлекаем индекс из [1] или {0}, или используем currentIndex для ___
      // [1], [2] - 1-based формат в тексте, всегда преобразуем в 0-based индекс массива
      // {0}, {1} - уже 0-based формат для индекса массива
      // ___ - используем currentIndex (последовательный индекс массива)
      let gapIndex: number;
      
      if (match[1]) {
        // Формат [1], [2], [1: ___] - извлекаем число (1-based в тексте)
        const gapNumberFromText = parseInt(match[1], 10);
        // Всегда преобразуем в 0-based индекс массива: [1] -> 0, [2] -> 1, [3] -> 2 и т.д.
        // Это гарантирует, что каждый пропуск в тексте соответствует своему gap в массиве по порядку
        gapIndex = gapNumberFromText - 1;
      } else if (match[2]) {
        // Формат {0}, {1} - уже 0-based формат для индекса массива
        gapIndex = parseInt(match[2], 10);
      } else {
        // Формат ___ - используем currentIndex (последовательный индекс массива)
        gapIndex = currentIndex;
      }
      
      // Получаем gap по индексу массива
      const gap = question.gaps[gapIndex];
      if (gap && gapIndex >= 0 && gapIndex < question.gaps.length) {
        // Используем уникальный ключ, включающий позицию в тексте и gapIndex
        const uniqueKey = `gap-${match.index}-${gapIndex}`;
        const currentValue = selectedIndices[gapIndex] ?? -1;
        const isFilled = currentValue >= 0;
        
        parts.push(
          <select
            key={uniqueKey}
            value={currentValue}
            onChange={(e) => {
              const newValue = parseInt(e.target.value, 10);
              handleGapChange(gapIndex, newValue);
            }}
            disabled={disabled}
            className={`min-h-[44px] text-base font-semibold border-3 rounded-lg px-3 py-2 mx-1 touch-manipulation transition-all shadow-md ${
              isFilled
                ? "border-green-500 bg-green-50 text-green-900"
                : "border-amber-500 bg-amber-50 text-amber-900 animate-pulse"
            } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:scale-105"}`}
            style={{ minWidth: "150px" }}
          >
            <option value={-1} disabled>
              {isFilled ? "✓ Выбрано" : "❓ Выберите..."}
            </option>
            {gap.options.map((opt, optIdx) => (
              <option key={optIdx} value={optIdx}>
                {opt}
              </option>
            ))}
          </select>
        );
      }

      lastIndex = match.index + match[0].length;
      currentIndex++;
    }

    // Остаток текста
    if (lastIndex < text.length) {
      parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
    }

    return parts;
  };

  return (
    <div className="space-y-4">
      {/* Инструкция и счетчик */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-700">
            📝 Заполните все пропуски в тексте
          </span>
          <span className={`text-lg font-bold ${
            filledGaps === totalGaps ? "text-green-600" : "text-amber-600"
          }`}>
            {filledGaps} / {totalGaps}
          </span>
        </div>
        {totalGaps > 0 && (
          <div className="w-full bg-zinc-200 rounded-full h-2 mt-2">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                filledGaps === totalGaps ? "bg-green-600" : "bg-amber-500"
              }`}
              style={{ width: `${(filledGaps / totalGaps) * 100}%` }}
            />
          </div>
        )}
      </div>

      <div className="text-base sm:text-lg leading-relaxed p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-300 shadow-sm">
        {renderText()}
      </div>

      {/* Подсказка о незаполненных */}
      {filledGaps < totalGaps && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-300 rounded-lg p-3">
          ⚠️ Осталось заполнить пропусков: {totalGaps - filledGaps}
        </div>
      )}
    </div>
  );
}
