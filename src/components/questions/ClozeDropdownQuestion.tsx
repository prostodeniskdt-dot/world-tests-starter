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
  const selectedIndices = (answer as number[] | null) || question.gaps.map(() => 0);

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
    const gapPattern = /___|\{(\d+)\}/g;
    let lastIndex = 0;
    let match;

    while ((match = gapPattern.exec(text)) !== null) {
      // Текст до пропуска
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>{text.substring(lastIndex, match.index)}</span>
        );
      }

      // Пропуск
      const gapIndex = match[1] ? parseInt(match[1], 10) : currentIndex;
      const gap = question.gaps[gapIndex];
      if (gap) {
        parts.push(
          <select
            key={`gap-${gapIndex}`}
            value={selectedIndices[gapIndex]}
            onChange={(e) => handleGapChange(gapIndex, parseInt(e.target.value, 10))}
            disabled={disabled}
            className="min-h-[44px] text-base border-2 border-primary-400 rounded px-2 py-1 mx-1 touch-manipulation bg-white"
            style={{ minWidth: "120px" }}
          >
            <option value={0}>Выберите...</option>
            {gap.options.map((opt, optIdx) => (
              <option key={optIdx} value={optIdx + 1}>
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
      <div className="text-base sm:text-lg leading-relaxed p-4 bg-zinc-50 rounded-lg border border-zinc-200">
        {renderText()}
      </div>
    </div>
  );
}
