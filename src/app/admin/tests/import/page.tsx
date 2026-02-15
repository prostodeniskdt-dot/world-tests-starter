"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, AlertCircle, CheckCircle } from "lucide-react";

const EXAMPLE_JSON = `{
  "id": "my-test-1",
  "title": "Название теста",
  "description": "Описание • 5 вопросов",
  "category": "категория",
  "difficultyLevel": 1,
  "basePoints": 200,
  "maxAttempts": null,
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "text": "Текст вопроса?",
      "options": ["Вариант A", "Вариант B", "Вариант C"],
      "hint": "Подсказка после ответа"
    }
  ],
  "answerKey": {
    "q1": 0
  }
}`;

type ValidationError = {
  field: string;
  message: string;
};

function validateTestJson(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.title || typeof data.title !== "string") {
    errors.push({ field: "title", message: "Обязательное поле title (строка)" });
  }

  if (!data.questions || !Array.isArray(data.questions)) {
    errors.push({ field: "questions", message: "Обязательное поле questions (массив)" });
  } else if (data.questions.length === 0) {
    errors.push({ field: "questions", message: "Массив questions не может быть пустым" });
  } else {
    // Проверяем каждый вопрос
    data.questions.forEach((q: any, i: number) => {
      if (!q.id) errors.push({ field: `questions[${i}].id`, message: `Вопрос ${i + 1}: отсутствует id` });
      if (!q.type) errors.push({ field: `questions[${i}].type`, message: `Вопрос ${i + 1}: отсутствует type` });
      if (!q.text) errors.push({ field: `questions[${i}].text`, message: `Вопрос ${i + 1}: отсутствует text` });

      const validTypes = [
        "multiple-choice", "multiple-select", "true-false-enhanced",
        "cloze-dropdown", "select-errors", "matching", "ordering",
        "two-step", "matrix", "grouping"
      ];
      if (q.type && !validTypes.includes(q.type)) {
        errors.push({ field: `questions[${i}].type`, message: `Вопрос ${i + 1}: неизвестный тип "${q.type}"` });
      }
    });
  }

  if (!data.answerKey || typeof data.answerKey !== "object" || Array.isArray(data.answerKey)) {
    errors.push({ field: "answerKey", message: "Обязательное поле answerKey (объект)" });
  } else if (data.questions && Array.isArray(data.questions)) {
    // Проверяем что для каждого вопроса есть ответ
    data.questions.forEach((q: any) => {
      if (q.id && !(q.id in data.answerKey)) {
        errors.push({ field: `answerKey.${q.id}`, message: `Отсутствует ответ для вопроса "${q.id}"` });
      }
    });
  }

  return errors;
}

export default function ImportTestPage() {
  const router = useRouter();
  const [json, setJson] = useState("");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [parsed, setParsed] = useState<any>(null);

  const handleValidate = () => {
    setErrors([]);
    setSuccess(null);
    setParsed(null);

    if (!json.trim()) {
      setErrors([{ field: "json", message: "Вставьте JSON" }]);
      return;
    }

    let data: any;
    try {
      data = JSON.parse(json);
    } catch (e: any) {
      setErrors([{ field: "json", message: `Ошибка парсинга JSON: ${e.message}` }]);
      return;
    }

    const validationErrors = validateTestJson(data);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setParsed(data);
    setSuccess(`Валидация пройдена: "${data.title}" — ${data.questions.length} вопросов`);
  };

  const handleImport = async () => {
    if (!parsed) return;
    setSubmitting(true);
    setErrors([]);

    try {
      const res = await fetch("/api/admin/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();

      if (!data.ok) {
        setErrors([{ field: "server", message: data.error }]);
        return;
      }

      router.push(`/admin/tests/${data.testId}/preview`);
    } catch (err: any) {
      setErrors([{ field: "server", message: err.message }]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/admin/tests" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Назад к тестам
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <Upload className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-zinc-900">Импорт теста из JSON</h1>
        </div>

        {/* Инструкция */}
        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-zinc-900 mb-2">Как это работает</h2>
          <ol className="list-decimal list-inside text-sm text-zinc-600 space-y-1">
            <li>Попросите ИИ (ChatGPT, Claude) сгенерировать тест в JSON-формате по шаблону ниже</li>
            <li>Вставьте JSON в поле ниже</li>
            <li>Нажмите &quot;Валидировать&quot; — система проверит структуру</li>
            <li>Если ошибок нет — нажмите &quot;Импортировать&quot;</li>
            <li>Тест будет сохранён как черновик. Проверьте его в превью и опубликуйте</li>
          </ol>
        </div>

        {/* JSON input */}
        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm p-6 mb-6">
          <label className="block font-semibold text-zinc-900 mb-2">JSON теста</label>
          <textarea
            className="w-full h-96 font-mono text-sm border border-zinc-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
            placeholder={EXAMPLE_JSON}
            value={json}
            onChange={(e) => {
              setJson(e.target.value);
              setErrors([]);
              setSuccess(null);
              setParsed(null);
            }}
          />

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleValidate}
              className="px-4 py-2 rounded-lg bg-zinc-100 text-zinc-700 font-semibold text-sm hover:bg-zinc-200 transition-colors"
            >
              Валидировать
            </button>

            {parsed && (
              <button
                onClick={handleImport}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-zinc-900 text-white font-semibold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {submitting ? "Импорт..." : "Импортировать"}
              </button>
            )}

            <button
              onClick={() => setJson(EXAMPLE_JSON)}
              className="px-4 py-2 rounded-lg border border-zinc-300 text-zinc-600 font-semibold text-sm hover:bg-zinc-50 transition-colors"
            >
              Вставить пример
            </button>
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="font-semibold text-red-800">Ошибки валидации</span>
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

        {/* Success */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800">{success}</span>
            </div>
          </div>
        )}

        {/* JSON template reference */}
        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm p-6">
          <h2 className="font-semibold text-zinc-900 mb-3">Справка: типы вопросов</h2>
          <div className="text-sm text-zinc-600 space-y-2">
            <p><code className="bg-zinc-100 px-1 rounded">multiple-choice</code> — один правильный ответ. Ответ: <code>число</code> (индекс)</p>
            <p><code className="bg-zinc-100 px-1 rounded">multiple-select</code> — несколько правильных. Ответ: <code>[числа]</code></p>
            <p><code className="bg-zinc-100 px-1 rounded">true-false-enhanced</code> — верно/неверно + причина. Ответ: <code>{`{answer: bool, reason: число}`}</code></p>
            <p><code className="bg-zinc-100 px-1 rounded">cloze-dropdown</code> — заполнение пропусков. Ответ: <code>[числа]</code> (индекс для каждого gap)</p>
            <p><code className="bg-zinc-100 px-1 rounded">select-errors</code> — выбор ошибок в тексте. Ответ: <code>[числа]</code></p>
            <p><code className="bg-zinc-100 px-1 rounded">matching</code> — сопоставление. Ответ: <code>[[left, right], ...]</code></p>
            <p><code className="bg-zinc-100 px-1 rounded">ordering</code> — упорядочивание. Ответ: <code>[числа]</code> (правильный порядок)</p>
            <p><code className="bg-zinc-100 px-1 rounded">two-step</code> — двухступенчатый. Ответ: <code>{`{step1: число, step2Mapping: {число: число}}`}</code></p>
            <p><code className="bg-zinc-100 px-1 rounded">matrix</code> — матрица. Ответ: <code>{`{строка: число}`}</code> или <code>{`{строка: [числа]}`}</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
