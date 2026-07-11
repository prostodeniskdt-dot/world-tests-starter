"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, AlertCircle, CheckCircle, FileText } from "lucide-react";

const EXAMPLE_JSON = `{
  "schemaVersion": 1,
  "title": "Название теста",
  "description": "Описание",
  "category": "категория",
  "difficultyLevel": 1,
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "text": "Текст вопроса?",
      "options": ["Вариант A", "Вариант B"]
    }
  ],
  "answerKey": { "q1": 0 }
}`;

type ValidationError = { field: string; message: string; severity?: string };

export default function ImportTestPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [format, setFormat] = useState<"auto" | "json" | "markdown">("auto");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [warnings, setWarnings] = useState<ValidationError[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [parsed, setParsed] = useState<Record<string, unknown> | null>(null);
  const [previewMeta, setPreviewMeta] = useState<{
    questionCount?: number;
    mechanics?: Record<string, number>;
    hintCount?: number;
    mediaCount?: number;
  } | null>(null);

  const handleValidate = async () => {
    setErrors([]);
    setWarnings([]);
    setSuccess(null);
    setParsed(null);
    setPreviewMeta(null);

    if (!text.trim()) {
      setErrors([{ field: "input", message: "Вставьте JSON или Markdown" }]);
      return;
    }

    try {
      const res = await fetch("/api/admin/tests/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text, format }),
      });
      const data = await res.json();
      const preview = data.preview;
      if (!preview) {
        setErrors([{ field: "server", message: data.error || "Ошибка preview" }]);
        return;
      }

      const errList = (preview.issues ?? []).filter((i: ValidationError) => i.severity === "error");
      const warnList = (preview.issues ?? []).filter((i: ValidationError) => i.severity === "warning");

      if (errList.length > 0) {
        setErrors(errList.map((i: { path: string; message: string }) => ({ field: i.path, message: i.message })));
        return;
      }

      setWarnings(warnList.map((i: { path: string; message: string }) => ({ field: i.path, message: i.message })));
      setParsed(preview.normalized ?? null);
      setPreviewMeta({
        questionCount: preview.questionCount,
        mechanics: preview.mechanics,
        hintCount: preview.hintCount,
        mediaCount: preview.mediaCount,
      });
      setSuccess(`Preview OK: «${preview.title}» — ${preview.questionCount} вопросов`);
    } catch (err: unknown) {
      setErrors([{ field: "server", message: err instanceof Error ? err.message : "Ошибка" }]);
    }
  };

  const handleFile = async (file: File) => {
    const content = await file.text();
    setText(content);
    if (file.name.endsWith(".md")) setFormat("markdown");
    else if (file.name.endsWith(".json")) setFormat("json");
  };

  const handleImport = async () => {
    if (!parsed) return;
    setSubmitting(true);
    setErrors([]);
    try {
      const res = await fetch("/api/admin/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!data.ok) {
        setErrors([{ field: "server", message: data.error }]);
        return;
      }
      // Если тест с таким ID раньше редактировали, старый localStorage-черновик
      // не должен заменять только что импортированные серверные данные.
      try {
        localStorage.removeItem(`test-editor-draft:${data.testId}`);
      } catch {
        /* private mode */
      }
      router.push(`/admin/tests/${data.testId}/edit`);
    } catch (err: unknown) {
      setErrors([{ field: "server", message: err instanceof Error ? err.message : "Ошибка" }]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/admin/tests" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Назад к тестам
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <Upload className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-zinc-900">Импорт теста (JSON / Markdown)</h1>
        </div>

        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-3 mb-4">
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as "auto" | "json" | "markdown")}
              className="border border-zinc-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="auto">Авто-формат</option>
              <option value="json">JSON</option>
              <option value="markdown">Markdown bundle</option>
            </select>
            <label className="inline-flex items-center gap-2 px-3 py-2 border border-zinc-300 rounded-lg text-sm cursor-pointer hover:bg-zinc-50">
              <FileText className="h-4 w-4" />
              Загрузить файл
              <input
                type="file"
                accept=".json,.md,.txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
              />
            </label>
          </div>

          <textarea
            className="w-full h-96 font-mono text-sm border border-zinc-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
            placeholder={EXAMPLE_JSON}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setErrors([]);
              setWarnings([]);
              setSuccess(null);
              setParsed(null);
            }}
          />

          <div className="flex items-center gap-3 mt-4">
            <button onClick={handleValidate} className="px-4 py-2 rounded-lg bg-zinc-100 text-zinc-700 font-semibold text-sm hover:bg-zinc-200">
              Preview / Валидировать
            </button>
            {parsed && (
              <button
                onClick={handleImport}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-zinc-900 text-white font-semibold text-sm hover:bg-zinc-800 disabled:opacity-50"
              >
                {submitting ? "Импорт..." : "Импортировать черновик"}
              </button>
            )}
            <button onClick={() => setText(EXAMPLE_JSON)} className="px-4 py-2 rounded-lg border border-zinc-300 text-zinc-600 text-sm hover:bg-zinc-50">
              Пример JSON
            </button>
          </div>
        </div>

        {previewMeta && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm text-blue-900">
            <p>
              Вопросов: {previewMeta.questionCount}. Подсказок: {previewMeta.hintCount ?? 0}.
              Изображений: {previewMeta.mediaCount ?? 0}.
            </p>
            <p className="mt-1">
              Механики:{" "}
              {Object.entries(previewMeta.mechanics ?? {})
                .map(([k, v]) => `${k} (${v})`)
                .join(", ")}
            </p>
            {(previewMeta.hintCount ?? 0) === 0 && (
              <p className="mt-2 text-amber-800">
                В импортируемом файле нет непустых полей <code>hint</code>. Подсказки не появятся после прохождения теста.
              </p>
            )}
          </div>
        )}

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="font-semibold text-red-800">Ошибки</span>
            </div>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {errors.map((err, i) => (
                <li key={i}>
                  <code className="font-mono text-xs bg-red-100 px-1 rounded">{err.field}</code>: {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-900">
            <p className="font-semibold mb-1">Предупреждения конвертации</p>
            <ul className="list-disc list-inside space-y-1">
              {warnings.map((w, i) => (
                <li key={i}>{w.field}: {w.message}</li>
              ))}
            </ul>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800">{success}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
