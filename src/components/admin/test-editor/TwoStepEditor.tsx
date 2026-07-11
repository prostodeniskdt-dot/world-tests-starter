"use client";

const labelClass = "block text-sm font-medium text-zinc-700 mb-1";
const inputClass =
  "w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";

type TwoStepEditorProps = {
  question: {
    step1?: { question?: string; options?: string[] };
    step2?: { question?: string; options?: string[] };
  };
  answerKey: { step1?: number; step2Mapping?: Record<string, number> };
  onQuestionChange: (field: string, value: unknown) => void;
  onAnswerChange: (value: unknown) => void;
};

function linesToOptions(text: string): string[] {
  return text.split("\n").map((s) => s.trim()).filter(Boolean);
}

export function TwoStepEditor({ question, answerKey, onQuestionChange, onAnswerChange }: TwoStepEditorProps) {
  const step1Options = question.step1?.options ?? [""];
  const step2Options = question.step2?.options ?? [""];
  const mapping = answerKey.step2Mapping ?? { 0: 0 };
  const step1 = answerKey.step1 ?? 0;

  return (
    <div className="space-y-4">
      <div className="p-3 border border-zinc-200 rounded-lg space-y-2">
        <label className={labelClass}>Шаг 1 — вопрос</label>
        <input
          className={inputClass}
          value={question.step1?.question ?? ""}
          onChange={(e) =>
            onQuestionChange("step1", { ...question.step1, question: e.target.value, options: step1Options })
          }
        />
        <label className={labelClass}>Варианты шага 1 (каждый с новой строки)</label>
        <textarea
          className={`${inputClass} font-mono resize-y`}
          rows={3}
          value={step1Options.join("\n")}
          onChange={(e) =>
            onQuestionChange("step1", {
              ...question.step1,
              question: question.step1?.question ?? "",
              options: linesToOptions(e.target.value).length ? linesToOptions(e.target.value) : [""],
            })
          }
        />
        <label className={labelClass}>Правильный ответ шага 1</label>
        <select
          className={inputClass}
          value={step1}
          onChange={(e) => {
            const s1 = parseInt(e.target.value, 10);
            onAnswerChange({ step1: s1, step2Mapping: mapping });
          }}
        >
          {step1Options.map((opt, i) => (
            <option key={i} value={i}>
              {i + 1}. {opt.slice(0, 50)}
            </option>
          ))}
        </select>
      </div>
      <div className="p-3 border border-zinc-200 rounded-lg space-y-2">
        <label className={labelClass}>Шаг 2 — вопрос</label>
        <input
          className={inputClass}
          value={question.step2?.question ?? ""}
          onChange={(e) =>
            onQuestionChange("step2", { ...question.step2, question: e.target.value, options: step2Options })
          }
        />
        <label className={labelClass}>Варианты шага 2</label>
        <textarea
          className={`${inputClass} font-mono resize-y`}
          rows={3}
          value={step2Options.join("\n")}
          onChange={(e) =>
            onQuestionChange("step2", {
              ...question.step2,
              question: question.step2?.question ?? "",
              options: linesToOptions(e.target.value).length ? linesToOptions(e.target.value) : [""],
            })
          }
        />
        <label className={labelClass}>Правильный ответ шага 2 (для выбранного шага 1)</label>
        <select
          className={inputClass}
          value={mapping[String(step1)] ?? 0}
          onChange={(e) => {
            const s2 = parseInt(e.target.value, 10);
            onAnswerChange({ step1, step2Mapping: { ...mapping, [String(step1)]: s2 } });
          }}
        >
          {step2Options.map((opt, i) => (
            <option key={i} value={i}>
              {i + 1}. {opt.slice(0, 50)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
