"use client";

import type { SelectErrorsQuestion as SelectErrorsQuestionType, QuestionAnswer } from "@/tests/types";

interface SelectErrorsQuestionProps {
  question: SelectErrorsQuestionType;
  answer: QuestionAnswer | null;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

export function SelectErrorsQuestion({
  question,
  answer,
  onChange,
  disabled = false,
}: SelectErrorsQuestionProps) {
  const selectedIds = (answer as number[] | null) || [];

  const togglePart = (partId: number) => {
    if (disabled) return;
    const newSelection = selectedIds.includes(partId)
      ? selectedIds.filter((id) => id !== partId)
      : question.allowMultiple
      ? [...selectedIds, partId]
      : [partId];
    onChange(newSelection);
  };

  // Простое отображение: разбиваем контент на части
  const renderContent = () => {
    if (question.markedParts.length === 0) {
      // Если части не указаны, просто показываем контент с возможностью выделения
      return (
        <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200">
          <pre className="whitespace-pre-wrap text-sm">{question.content}</pre>
        </div>
      );
    }

    // Отображаем контент с выделенными частями
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    question.markedParts
      .sort((a, b) => a.start - b.start)
      .forEach((part) => {
        // Текст до части
        if (part.start > lastIndex) {
          parts.push(
            <span key={`text-${lastIndex}`}>
              {question.content.substring(lastIndex, part.start)}
            </span>
          );
        }

        // Выделенная часть
        const isSelected = selectedIds.includes(part.id);
        parts.push(
          <span
            key={`part-${part.id}`}
            onClick={() => togglePart(part.id)}
            className={`inline-block px-2 py-1 mx-1 rounded cursor-pointer touch-manipulation min-h-[32px] ${
              isSelected
                ? "bg-red-200 border-2 border-red-500"
                : "bg-yellow-100 border-2 border-yellow-300 hover:border-yellow-400"
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {part.text}
          </span>
        );

        lastIndex = part.end;
      });

    // Остаток текста
    if (lastIndex < question.content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>{question.content.substring(lastIndex)}</span>
      );
    }

    return parts;
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-zinc-600 mb-4">
        {question.allowMultiple
          ? "Выделите все ошибки (может быть несколько)"
          : "Выделите ошибку"}
      </div>
      <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200">
        <div className="text-sm sm:text-base leading-relaxed">{renderContent()}</div>
      </div>
      {selectedIds.length > 0 && (
        <div className="text-sm text-zinc-600">
          Выделено: {selectedIds.length} {selectedIds.length === 1 ? "ошибка" : "ошибок"}
        </div>
      )}
    </div>
  );
}
