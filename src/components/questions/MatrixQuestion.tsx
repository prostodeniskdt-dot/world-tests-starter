"use client";

import type { MatrixQuestion as MatrixQuestionType, QuestionAnswer } from "@/tests/types";
import { CheckSquare, Square, Circle } from "lucide-react";

interface MatrixQuestionProps {
  question: MatrixQuestionType;
  answer: QuestionAnswer | null;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

export function MatrixQuestion({
  question,
  answer,
  onChange,
  disabled = false,
}: MatrixQuestionProps) {
  if (question.matrixType === "single-select") {
    const selected = (answer as Record<number, number> | null) || {};

    const handleSelect = (rowIndex: number, colIndex: number) => {
      if (disabled) return;
      onChange({ ...selected, [rowIndex]: colIndex });
    };

    // Мобильная версия: вертикальная компоновка
    return (
      <div className="space-y-4">
        <div className="text-sm text-zinc-600 mb-4">
          Выберите характеристику для каждого объекта
        </div>
        <div className="block sm:hidden space-y-4">
          {question.rows.map((row, rowIdx) => (
            <div key={rowIdx} className="border border-zinc-200 rounded-lg p-4">
              <div className="font-semibold mb-3 text-zinc-900">{row}</div>
              <div className="space-y-2">
                {question.columns.map((col, colIdx) => {
                  const isSelected = selected[rowIdx] === colIdx;
                  return (
                    <label
                      key={colIdx}
                      className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 min-h-[44px] touch-manipulation ${
                        isSelected
                          ? "border-primary-500 bg-primary-50"
                          : "border-zinc-200 hover:border-primary-300"
                      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <input
                        type="radio"
                        name={`row-${rowIdx}`}
                        checked={isSelected}
                        disabled={disabled}
                        onChange={() => handleSelect(rowIdx, colIdx)}
                        className="hidden"
                      />
                      <div className="flex-shrink-0">
                        {isSelected ? (
                          <Circle className="h-5 w-5 text-primary-600 fill-primary-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-zinc-600" />
                        )}
                      </div>
                      <span className="text-zinc-700 flex-1 text-base sm:text-sm">{col}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Десктопная версия: таблица */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-zinc-300 p-3 text-left bg-zinc-50"></th>
                {question.columns.map((col, idx) => (
                  <th key={idx} className="border border-zinc-300 p-3 text-center bg-zinc-50">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {question.rows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td className="border border-zinc-300 p-3 font-medium">{row}</td>
                  {question.columns.map((col, colIdx) => {
                    const isSelected = selected[rowIdx] === colIdx;
                    return (
                      <td key={colIdx} className="border border-zinc-300 p-3 text-center">
                        <label className="cursor-pointer">
                          <input
                            type="radio"
                            name={`row-${rowIdx}`}
                            checked={isSelected}
                            disabled={disabled}
                            onChange={() => handleSelect(rowIdx, colIdx)}
                            className="hidden"
                          />
                          <div
                            className={`w-6 h-6 rounded-full border-2 mx-auto ${
                              isSelected
                                ? "border-primary-600 bg-primary-100"
                                : "border-zinc-300"
                            }`}
                          />
                        </label>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  } else {
    // multiple-select
    const selected = (answer as Record<number, number[]> | null) || {};

    const toggleSelection = (rowIndex: number, colIndex: number) => {
      if (disabled) return;
      const rowSelection = selected[rowIndex] || [];
      const newSelection = rowSelection.includes(colIndex)
        ? rowSelection.filter((i) => i !== colIndex)
        : [...rowSelection, colIndex];
      onChange({ ...selected, [rowIndex]: newSelection });
    };

    return (
      <div className="space-y-4">
        <div className="text-sm text-zinc-600 mb-4">
          Выберите характеристики для каждого объекта (можно несколько)
        </div>
        <div className="block sm:hidden space-y-4">
          {question.rows.map((row, rowIdx) => (
            <div key={rowIdx} className="border border-zinc-200 rounded-lg p-4">
              <div className="font-semibold mb-3 text-zinc-900">{row}</div>
              <div className="space-y-2">
                {question.columns.map((col, colIdx) => {
                  const isSelected = selected[rowIdx]?.includes(colIdx);
                  return (
                    <label
                      key={colIdx}
                      className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 min-h-[44px] touch-manipulation ${
                        isSelected
                          ? "border-primary-500 bg-primary-50"
                          : "border-zinc-200 hover:border-primary-300"
                      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={disabled}
                        onChange={() => toggleSelection(rowIdx, colIdx)}
                        className="hidden"
                      />
                      <div className="flex-shrink-0">
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-primary-600" />
                        ) : (
                          <Square className="h-5 w-5 text-zinc-600" />
                        )}
                      </div>
                      <span className="text-zinc-700 flex-1 text-base sm:text-sm">{col}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Десктопная версия */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-zinc-300 p-3 text-left bg-zinc-50"></th>
                {question.columns.map((col, idx) => (
                  <th key={idx} className="border border-zinc-300 p-3 text-center bg-zinc-50">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {question.rows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td className="border border-zinc-300 p-3 font-medium">{row}</td>
                  {question.columns.map((col, colIdx) => {
                    const isSelected = selected[rowIdx]?.includes(colIdx);
                    return (
                      <td key={colIdx} className="border border-zinc-300 p-3 text-center">
                        <label className="cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={disabled}
                            onChange={() => toggleSelection(rowIdx, colIdx)}
                            className="hidden"
                          />
                          <div
                            className={`w-6 h-6 border-2 mx-auto flex items-center justify-center ${
                              isSelected
                                ? "border-primary-600 bg-primary-100"
                                : "border-zinc-300"
                            }`}
                          >
                            {isSelected && <div className="w-3 h-3 bg-primary-600" />}
                          </div>
                        </label>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
