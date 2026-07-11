"use client";

const labelClass = "block text-sm font-medium text-zinc-700 mb-1";
const inputClass =
  "w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";

type MatrixEditorProps = {
  question: {
    rows?: string[];
    columns?: string[];
    matrixType?: "single-select" | "multiple-select";
  };
  answerKey: Record<string, number | number[]>;
  onQuestionChange: (field: string, value: unknown) => void;
  onAnswerChange: (value: unknown) => void;
};

function lines(text: string): string[] {
  return text.split("\n").map((s) => s.trim()).filter(Boolean);
}

export function MatrixEditor({ question, answerKey, onQuestionChange, onAnswerChange }: MatrixEditorProps) {
  const rows = question.rows ?? [];
  const columns = question.columns ?? [];
  const matrixType = question.matrixType ?? "single-select";

  const updateCell = (rowIdx: number, colIdx: number, checked: boolean) => {
    const key = { ...answerKey };
    if (matrixType === "single-select") {
      key[String(rowIdx)] = colIdx;
    } else {
      const existing = Array.isArray(key[String(rowIdx)])
        ? ([...(key[String(rowIdx)] as number[])])
        : [];
      const set = new Set(existing);
      if (checked) set.add(colIdx);
      else set.delete(colIdx);
      key[String(rowIdx)] = Array.from(set).sort((a, b) => a - b);
    }
    onAnswerChange(key);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Тип матрицы</label>
        <select
          className={inputClass}
          value={matrixType}
          onChange={(e) => onQuestionChange("matrixType", e.target.value)}
        >
          <option value="single-select">Один ответ на строку</option>
          <option value="multiple-select">Несколько на строку</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Строки</label>
        <textarea
          className={`${inputClass} resize-y`}
          rows={4}
          value={rows.join("\n")}
          onChange={(e) => onQuestionChange("rows", lines(e.target.value))}
        />
      </div>
      <div>
        <label className={labelClass}>Столбцы</label>
        <textarea
          className={`${inputClass} resize-y`}
          rows={3}
          value={columns.join("\n")}
          onChange={(e) => onQuestionChange("columns", lines(e.target.value))}
        />
      </div>
      {rows.length > 0 && columns.length > 0 && (
        <div className="space-y-2">
          <label className={labelClass}>Правильные ответы</label>
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className="border border-zinc-200 rounded-lg p-2">
              <div className="text-sm font-medium mb-2">{row.slice(0, 60)}</div>
              <div className="flex flex-wrap gap-2">
                {columns.map((col, colIdx) => {
                  const val = answerKey[String(rowIdx)];
                  const checked =
                    matrixType === "single-select"
                      ? val === colIdx
                      : Array.isArray(val) && val.includes(colIdx);
                  return (
                    <label key={colIdx} className="flex items-center gap-1 text-sm">
                      <input
                        type={matrixType === "single-select" ? "radio" : "checkbox"}
                        name={`matrix-row-${rowIdx}`}
                        checked={!!checked}
                        onChange={(e) => updateCell(rowIdx, colIdx, e.target.checked)}
                      />
                      {col.slice(0, 30)}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
