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

    // Встраиваем кликабельные фрагменты в исходный текст, не теряя контекст.
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    const resolvedParts = [...question.markedParts]
      .sort((a, b) => (a.start ?? Number.MAX_SAFE_INTEGER) - (b.start ?? Number.MAX_SAFE_INTEGER))
      .map((part) => {
        const declaredStart =
          typeof part.start === "number" &&
          part.start >= cursor &&
          question.content.slice(part.start, part.end).trim() === part.text.trim()
            ? part.start
            : question.content.indexOf(part.text, cursor);
        const start = declaredStart >= cursor ? declaredStart : cursor;
        cursor = start + part.text.length;
        return { ...part, start, end: start + part.text.length };
      });

    cursor = 0;
    resolvedParts.forEach((part) => {
        if (part.start > cursor) {
          parts.push(
            <span key={`text-${cursor}`}>{question.content.slice(cursor, part.start)}</span>
          );
        }
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
        cursor = part.end;
      });

    if (cursor < question.content.length) {
      parts.push(<span key={`text-${cursor}`}>{question.content.slice(cursor)}</span>);
    }

    return parts;
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-white rounded-lg border border-zinc-200">
        <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
