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

        // Выделенная часть с номером
        const isSelected = selectedIds.includes(part.id);
        const partNumber = getPartNumber(part.id);
        parts.push(
          <span
            key={`part-${part.id}`}
            onClick={() => togglePart(part.id)}
            className={`inline-flex items-center gap-1 px-2 py-1 mx-1 rounded-lg cursor-pointer touch-manipulation min-h-[32px] transition-all ${
              isSelected
                ? "bg-red-100 border-2 border-red-500 shadow-md font-medium"
                : "bg-yellow-50 border-2 border-yellow-400 hover:border-yellow-500 hover:bg-yellow-100 hover:shadow"
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              isSelected ? "bg-red-600 text-white" : "bg-yellow-600 text-white"
            }`}>
              {partNumber}
            </span>
            <span>{part.text}</span>
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
      <div className="text-sm font-medium text-zinc-700 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
        <span>
          {question.allowMultiple
            ? `Найдите все ошибки${expectedErrors ? ` (${expectedErrors} шт.)` : " (может быть несколько)"}`
            : "Найдите ошибку"}
        </span>
      </div>

      {/* Счетчик выбранных ошибок */}
      <div className={`p-3 rounded-lg border-2 transition-all ${
        expectedErrors && selectedIds.length === parseInt(expectedErrors)
          ? "bg-green-50 border-green-400"
          : selectedIds.length > 0
          ? "bg-amber-50 border-amber-400"
          : "bg-zinc-50 border-zinc-300"
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700">
            {selectedIds.length > 0 ? "🔍 Найдено ошибок:" : "❓ Ошибки не выбраны"}
          </span>
          <span className={`text-xl font-bold ${
            expectedErrors && selectedIds.length === parseInt(expectedErrors)
              ? "text-green-600"
              : selectedIds.length > 0
              ? "text-amber-600"
              : "text-zinc-400"
          }`}>
            {selectedIds.length}{expectedErrors ? ` / ${expectedErrors}` : ""}
          </span>
        </div>
      </div>

      {/* Список выбранных ошибок */}
      {selectedIds.length > 0 && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <h4 className="font-semibold text-red-900 mb-3 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Выбранные ошибки:
          </h4>
          <div className="space-y-2">
            {selectedIds.map((partId) => {
              const part = question.markedParts.find(p => p.id === partId);
              if (!part) return null;
              return (
                <div key={partId} className="flex items-start gap-2 p-2 bg-white rounded border border-red-200">
                  <span className="flex-shrink-0 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    {getPartNumber(partId)}
                  </span>
                  <span className="flex-1 text-sm text-zinc-700">{part.text}</span>
                  {!disabled && (
                    <button
                      onClick={() => togglePart(partId)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded px-2 py-1 text-xs transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="text-sm font-medium text-zinc-700 mb-2">
        Нажмите на выделенные фрагменты, чтобы отметить ошибки:
      </div>
      <div className="p-4 bg-zinc-50 rounded-lg border-2 border-zinc-300">
        <div className="text-sm sm:text-base leading-relaxed">{renderContent()}</div>
      </div>
    </div>
  );
}
