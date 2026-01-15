"use client";

import { useState } from "react";
import type { MatrixQuestion as MatrixQuestionType, QuestionAnswer } from "@/tests/types";
import { CheckSquare, Square, Circle, CheckCircle2 } from "lucide-react";

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
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  if (question.matrixType === "single-select") {
    const selected = (answer as Record<number, number> | null) || {};
    const completedRows = Object.keys(selected).length;

    const handleSelect = (rowIndex: number, colIndex: number) => {
      if (disabled) return;
      onChange({ ...selected, [rowIndex]: colIndex });
    };

    // Мобильная версия: вертикальная компоновка
    return (
      <div className="space-y-4">
        <div className="text-sm font-medium text-zinc-700 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          📊 Выберите одну характеристику для каждого объекта
        </div>

        {/* Прогресс заполнения */}
        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-zinc-600">Заполнено строк:</span>
            <span className="font-bold text-primary-600">{completedRows} / {question.rows.length}</span>
          </div>
          <div className="w-full bg-zinc-200 rounded-full h-2">
            <div 
              className="gradient-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${(completedRows / question.rows.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Легенда с буквами */}
        <div className="p-4 bg-purple-50 border-2 border-purple-300 rounded-lg">
          <h4 className="font-bold text-purple-900 mb-3 text-sm">📖 Легенда характеристик:</h4>
          <div className="space-y-2">
            {question.columns.map((col, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0 bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-zinc-700">{col}</span>
              </div>
            ))}
          </div>
        </div>
        {/* УЛУЧШЕННАЯ мобильная версия */}
        <div className="block sm:hidden space-y-4">
          {question.rows.map((row, rowIdx) => {
            const hasSelection = selected[rowIdx] !== undefined;
            return (
              <div 
                key={rowIdx} 
                className={`border-2 rounded-xl p-4 transition-all ${
                  hasSelection 
                    ? "border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md" 
                    : "border-zinc-300 bg-white"
                }`}
              >
                <div className="flex items-start gap-2 mb-3">
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                    hasSelection ? "bg-green-600 text-white" : "bg-zinc-200 text-zinc-700"
                  }`}>
                    {rowIdx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="font-bold text-zinc-900 text-base break-words">{row}</div>
                    {hasSelection && (
                      <div className="text-xs text-green-700 font-medium mt-1">
                        ✓ Выбрано: {String.fromCharCode(65 + selected[rowIdx])}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {question.columns.map((col, colIdx) => {
                    const isSelected = selected[rowIdx] === colIdx;
                    return (
                      <label
                        key={colIdx}
                        className={`flex items-start gap-3 rounded-lg border-2 px-4 py-3 min-h-[44px] touch-manipulation transition-all ${
                          isSelected
                            ? "border-green-600 bg-green-50 shadow-lg ring-2 ring-green-300"
                            : "border-zinc-300 hover:border-primary-300 bg-white"
                        } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer active:scale-95"}`}
                      >
                        <input
                          type="radio"
                          name={`row-${rowIdx}`}
                          checked={isSelected}
                          disabled={disabled}
                          onChange={() => handleSelect(rowIdx, colIdx)}
                          className="hidden"
                        />
                        <div className="flex-shrink-0 mt-0.5">
                          {isSelected ? (
                            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{String.fromCharCode(65 + colIdx)}</span>
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-zinc-400 flex items-center justify-center">
                              <span className="text-zinc-600 text-xs font-bold">{String.fromCharCode(65 + colIdx)}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-zinc-700 flex-1 text-sm leading-relaxed break-words">{col}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Десктопная версия: улучшенная таблица */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-2 border-zinc-400 p-3 text-left bg-gradient-to-r from-zinc-100 to-zinc-50 font-bold">
                  Объект
                </th>
                {question.columns.map((col, idx) => (
                  <th 
                    key={idx} 
                    className={`border-2 border-zinc-400 p-3 text-center bg-gradient-to-r from-purple-100 to-purple-50 transition-all ${
                      hoveredCol === idx ? "bg-purple-200 scale-105" : ""
                    }`}
                    onMouseEnter={() => setHoveredCol(idx)}
                    onMouseLeave={() => setHoveredCol(null)}
                  >
                    <div className="font-bold text-purple-900 mb-1 text-lg">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <div className="text-xs text-zinc-600 font-normal line-clamp-2">
                      {col.length > 40 ? col.substring(0, 40) + "..." : col}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {question.rows.map((row, rowIdx) => {
                const hasSelection = selected[rowIdx] !== undefined;
                return (
                  <tr 
                    key={rowIdx}
                    className={`transition-all ${
                      hoveredRow === rowIdx ? "bg-blue-50" : ""
                    }`}
                    onMouseEnter={() => setHoveredRow(rowIdx)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td className="border-2 border-zinc-400 p-3 font-medium bg-white">
                      <div className="flex items-center gap-2">
                        {hasSelection && (
                          <span className="bg-green-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">
                            ✓
                          </span>
                        )}
                        <span>{row}</span>
                      </div>
                    </td>
                    {question.columns.map((col, colIdx) => {
                      const isSelected = selected[rowIdx] === colIdx;
                      const isHovered = hoveredRow === rowIdx || hoveredCol === colIdx;
                      return (
                        <td 
                          key={colIdx} 
                          className={`border-2 border-zinc-400 p-3 text-center transition-all ${
                            isHovered ? "bg-purple-50" : "bg-white"
                          }`}
                        >
                          <label className="cursor-pointer block">
                            <input
                              type="radio"
                              name={`row-${rowIdx}`}
                              checked={isSelected}
                              disabled={disabled}
                              onChange={() => handleSelect(rowIdx, colIdx)}
                              className="hidden"
                            />
                            <div
                              className={`w-8 h-8 rounded-full border-3 mx-auto flex items-center justify-center transition-all ${
                                isSelected
                                  ? "border-primary-600 bg-primary-600 shadow-lg scale-110"
                                  : isHovered
                                  ? "border-primary-400 bg-primary-100 scale-105"
                                  : "border-zinc-300 hover:border-primary-400"
                              }`}
                            >
                              {isSelected && (
                                <CheckCircle2 className="h-5 w-5 text-white" />
                              )}
                            </div>
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  } else {
    // multiple-select
    const selected = (answer as Record<number, number[]> | null) || {};
    const completedRows = Object.keys(selected).filter(k => selected[parseInt(k)]?.length > 0).length;

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
        <div className="text-sm font-medium text-zinc-700 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          📊 Выберите характеристики для каждого объекта (можно несколько)
        </div>

        {/* Прогресс */}
        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-zinc-600">Заполнено строк:</span>
            <span className="font-bold text-primary-600">{completedRows} / {question.rows.length}</span>
          </div>
          <div className="w-full bg-zinc-200 rounded-full h-2">
            <div 
              className="gradient-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${(completedRows / question.rows.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Легенда */}
        <div className="p-4 bg-purple-50 border-2 border-purple-300 rounded-lg">
          <h4 className="font-bold text-purple-900 mb-3 text-sm">📖 Легенда характеристик:</h4>
          <div className="space-y-2">
            {question.columns.map((col, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0 bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-zinc-700">{col}</span>
              </div>
            ))}
          </div>
        </div>
        {/* УЛУЧШЕННАЯ мобильная версия */}
        <div className="block sm:hidden space-y-4">
          {question.rows.map((row, rowIdx) => {
            const rowSelections = selected[rowIdx] || [];
            const hasSelection = rowSelections.length > 0;
            
            return (
              <div 
                key={rowIdx} 
                className={`border-2 rounded-xl p-4 transition-all ${
                  hasSelection 
                    ? "border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md" 
                    : "border-zinc-300 bg-white"
                }`}
              >
                <div className="flex items-start gap-2 mb-3">
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                    hasSelection ? "bg-green-600 text-white" : "bg-zinc-200 text-zinc-700"
                  }`}>
                    {rowIdx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="font-bold text-zinc-900 text-base break-words">{row}</div>
                    {hasSelection && (
                      <div className="text-xs text-green-700 font-medium mt-1">
                        ✓ Выбрано: {rowSelections.map(c => String.fromCharCode(65 + c)).join(", ")}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {question.columns.map((col, colIdx) => {
                    const isSelected = selected[rowIdx]?.includes(colIdx);
                    return (
                      <label
                        key={colIdx}
                        className={`flex items-start gap-3 rounded-lg border-2 px-4 py-3 min-h-[44px] touch-manipulation transition-all ${
                          isSelected
                            ? "border-green-600 bg-green-50 shadow-lg ring-2 ring-green-300"
                            : "border-zinc-300 hover:border-primary-300 bg-white"
                        } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer active:scale-95"}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={disabled}
                          onChange={() => toggleSelection(rowIdx, colIdx)}
                          className="hidden"
                        />
                        <div className="flex-shrink-0 mt-0.5">
                          {isSelected ? (
                            <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{String.fromCharCode(65 + colIdx)}</span>
                            </div>
                          ) : (
                            <div className="w-6 h-6 border-2 border-zinc-400 rounded flex items-center justify-center">
                              <span className="text-zinc-600 text-xs font-bold">{String.fromCharCode(65 + colIdx)}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-zinc-700 flex-1 text-sm leading-relaxed break-words">{col}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Десктопная версия: улучшенная таблица */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-2 border-zinc-400 p-3 text-left bg-gradient-to-r from-zinc-100 to-zinc-50 font-bold">
                  Объект
                </th>
                {question.columns.map((col, idx) => (
                  <th 
                    key={idx} 
                    className={`border-2 border-zinc-400 p-3 text-center bg-gradient-to-r from-purple-100 to-purple-50 transition-all ${
                      hoveredCol === idx ? "bg-purple-200" : ""
                    }`}
                    onMouseEnter={() => setHoveredCol(idx)}
                    onMouseLeave={() => setHoveredCol(null)}
                  >
                    <div className="font-bold text-purple-900 text-lg">
                      {String.fromCharCode(65 + idx)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {question.rows.map((row, rowIdx) => {
                const rowSelections = selected[rowIdx] || [];
                const hasSelection = rowSelections.length > 0;
                return (
                  <tr 
                    key={rowIdx}
                    className={`transition-all ${
                      hoveredRow === rowIdx ? "bg-blue-50" : ""
                    }`}
                    onMouseEnter={() => setHoveredRow(rowIdx)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td className="border-2 border-zinc-400 p-3 font-medium bg-white">
                      <div className="flex items-center gap-2">
                        {hasSelection && (
                          <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                            {rowSelections.length}
                          </span>
                        )}
                        <span>{row}</span>
                      </div>
                    </td>
                    {question.columns.map((col, colIdx) => {
                      const isSelected = selected[rowIdx]?.includes(colIdx);
                      const isHovered = hoveredRow === rowIdx || hoveredCol === colIdx;
                      return (
                        <td 
                          key={colIdx} 
                          className={`border-2 border-zinc-400 p-3 text-center transition-all ${
                            isHovered ? "bg-purple-50" : "bg-white"
                          }`}
                        >
                          <label className="cursor-pointer block">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={disabled}
                              onChange={() => toggleSelection(rowIdx, colIdx)}
                              className="hidden"
                            />
                            <div
                              className={`w-8 h-8 border-3 mx-auto flex items-center justify-center rounded transition-all ${
                                isSelected
                                  ? "border-green-600 bg-green-600 shadow-lg"
                                  : isHovered
                                  ? "border-primary-400 bg-primary-100"
                                  : "border-zinc-300 hover:border-primary-400"
                              }`}
                            >
                              {isSelected && <CheckSquare className="h-5 w-5 text-white" />}
                            </div>
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
