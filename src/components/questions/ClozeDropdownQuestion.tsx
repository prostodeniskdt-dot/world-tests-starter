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
        const uniqueKey = `gap-${match.index}-${gapIndex}`;
        const currentValue = selectedIndices[gapIndex] ?? -1;
        const isFilled = currentValue >= 0;
        // value: пустая строка для "не выбрано" — тогда в поле показывается "Выберите...";
        // при выборе — индекс, чтобы в поле отображался текст выбранного варианта (важно для мобильных).
        const selectValue = currentValue < 0 ? "" : currentValue;

        parts.push(
          <select
            key={uniqueKey}
            value={selectValue}
            onChange={(e) => {
              const raw = e.target.value;
              const newValue = raw === "" ? -1 : parseInt(raw, 10);
              handleGapChange(gapIndex, newValue);
            }}
            disabled={disabled}
            className={`min-h-[44px] w-full min-w-[140px] max-w-[200px] sm:min-w-[160px] text-base font-semibold border-2 rounded-lg px-3 py-2.5 mx-0.5 touch-manipulation transition-all ${
              isFilled
                ? "border-primary-500 bg-primary-50 text-zinc-900"
                : "border-zinc-300 bg-zinc-50 text-zinc-700"
            } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-primary-400"}`}
          >
            <option value="">Выберите...</option>
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
      <div className="text-base sm:text-lg leading-relaxed p-4 bg-white rounded-lg border border-zinc-200 flex flex-wrap items-center gap-x-1.5 gap-y-2">
        {renderText()}
      </div>
    </div>
  );
}
