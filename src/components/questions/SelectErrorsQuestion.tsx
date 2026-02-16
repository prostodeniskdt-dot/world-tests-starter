"use client";

import type { SelectErrorsQuestion as SelectErrorsQuestionType, QuestionAnswer } from "@/tests/types";
import { AlertCircle } from "lucide-react";

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

  // Находим количество ошибок для подсказки (если есть)
  const expectedErrors = question.text.match(/найдите (\d+) ошибк/i)?.[1];
  const getPartNumber = (partId: number) => {
    return question.markedParts.findIndex(p => p.id === partId) + 1;
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

    // Отображаем части последовательно, разделяя их пробелами
    // Не используем content для промежуточного текста, чтобы избежать обрывков
    const parts: React.ReactNode[] = [];

    question.markedParts
      .sort((a, b) => a.start - b.start)
      .forEach((part, index) => {
        // Выделенная часть с номером
        const isSelected = selectedIds.includes(part.id);
        const partNumber = getPartNumber(part.id);
        parts.push(
          <span
            key={`part-${part.id}`}
            onClick={() => togglePart(part.id)}
            className={`inline-flex items-center gap-1 px-2 py-1 mx-1 rounded-lg cursor-pointer touch-manipulation min-h-[32px] transition-all border-2 ${
              isSelected
                ? "bg-primary-50 border-primary-500 shadow-md font-medium"
                : "bg-zinc-50 border-zinc-300 hover:border-primary-400 hover:bg-zinc-100"
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              isSelected ? "bg-primary-600 text-white" : "bg-zinc-400 text-white"
            }`}>
              {partNumber}
            </span>
            <span>{part.text}</span>
          </span>
        );

        // Добавляем пробел между частями (кроме последней)
        if (index < question.markedParts.length - 1) {
          parts.push(<span key={`space-${part.id}`}> </span>);
        }
      });

    return parts;
  };

  // Показываем утверждение отдельно, только когда есть markedParts (иначе content уже в renderContent)
  const statement = (question.markedParts.length > 0 ? (question.content || "").trim() : "");

  return (
    <div className="space-y-4">
      {statement && (
        <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200">
          <p className="text-sm sm:text-base leading-relaxed text-zinc-900">
            «{statement}»
          </p>
        </div>
      )}
      <div className="p-4 bg-white rounded-lg border border-zinc-200">
        <div className="text-sm sm:text-base leading-relaxed flex flex-wrap gap-1 items-center">{renderContent()}</div>
      </div>
    </div>
  );
}
