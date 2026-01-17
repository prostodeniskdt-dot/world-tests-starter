"use client";

import { useEffect, useState } from "react";
import type { MatrixQuestion as MatrixQuestionType, QuestionAnswer } from "@/tests/types";

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
  const [rowSelections, setRowSelections] = useState<number[]>(
    () => Array.from({ length: question.rows.length }, () => -1)
  );
  const [multiSelections, setMultiSelections] = useState<Record<number, number[]>>({});

  useEffect(() => {
    if (question.matrixType === "multiple-select") {
      if (answer && typeof answer === "object") {
        setMultiSelections(answer as Record<number, number[]>);
      }
      return;
    }

    if (answer && typeof answer === "object") {
      const nextSelections = Array.from({ length: question.rows.length }, () => -1);
      Object.entries(answer as Record<number, number>).forEach(([rowKey, colIdx]) => {
        const rowIdx = Number(rowKey);
        if (!Number.isNaN(rowIdx) && rowIdx >= 0 && rowIdx < nextSelections.length) {
          nextSelections[rowIdx] = colIdx;
        }
      });
      setRowSelections(nextSelections);
    }
  }, [answer, question.rows.length, question.id, question.matrixType]);

  const commitSingleSelect = (nextSelections: number[]) => {
    const isComplete = nextSelections.every((idx) => idx >= 0);
    if (!isComplete) {
      onChange(null);
      return;
    }
    const result: Record<number, number> = {};
    nextSelections.forEach((colIdx, rowIdx) => {
      result[rowIdx] = colIdx;
    });
    onChange(result);
  };

  const commitMultipleSelect = (nextSelections: Record<number, number[]>) => {
    const isComplete = question.rows.every((_, rowIdx) => (nextSelections[rowIdx]?.length ?? 0) > 0);
    if (!isComplete) {
      onChange(null);
      return;
    }
    onChange(nextSelections);
  };

  if (question.matrixType === "multiple-select") {
    return (
      <div className="space-y-3">
        {question.rows.map((row, rowIdx) => (
          <div key={`${question.id}-row-${rowIdx}`} className="rounded-lg border border-zinc-200 bg-white p-3">
            <div className="text-sm font-semibold text-zinc-900 mb-2">{row}</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {question.columns.map((column, colIdx) => {
                const checked = (multiSelections[rowIdx] || []).includes(colIdx);
                return (
                  <label
                    key={`${question.id}-${rowIdx}-${colIdx}`}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                      disabled
                        ? checked
                          ? "border-green-500 bg-green-50"
                          : "border-zinc-200 bg-zinc-50 text-zinc-500"
                        : checked
                        ? "border-green-500 bg-green-50"
                        : "border-zinc-300 hover:border-primary-400 hover:bg-primary-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => {
                        if (disabled) return;
                        const nextSelections = { ...multiSelections };
                        const rowValues = new Set(nextSelections[rowIdx] ?? []);
                        if (rowValues.has(colIdx)) {
                          rowValues.delete(colIdx);
                        } else {
                          rowValues.add(colIdx);
                        }
                        nextSelections[rowIdx] = Array.from(rowValues).sort((a, b) => a - b);
                        setMultiSelections(nextSelections);
                        commitMultipleSelect(nextSelections);
                      }}
                      className="hidden"
                    />
                    <span>{column}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {question.rows.map((row, rowIdx) => (
        <div
          key={`${question.id}-row-${rowIdx}`}
          className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 sm:flex-row sm:items-center"
        >
          <div className="text-sm font-medium text-zinc-900 sm:flex-1">{row}</div>
          <select
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 sm:w-64"
            value={rowSelections[rowIdx] >= 0 ? rowSelections[rowIdx] : ""}
            onChange={(event) => {
              if (disabled) return;
              const nextSelections = [...rowSelections];
              nextSelections[rowIdx] = Number(event.target.value);
              setRowSelections(nextSelections);
              commitSingleSelect(nextSelections);
            }}
            disabled={disabled}
          >
            <option value="" disabled>
              Выберите вариант
            </option>
            {question.columns.map((column, colIdx) => (
              <option key={`${question.id}-${rowIdx}-${colIdx}`} value={colIdx}>
                {column}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
