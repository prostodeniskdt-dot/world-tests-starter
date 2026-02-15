"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Eye, ChevronDown, ChevronRight, Loader2, Trash2, Plus } from "lucide-react";

type TestData = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficultyLevel: number;
  basePoints: number;
  maxAttempts: number | null;
  questions: any[];
  answerKey: Record<string, any>;
  isPublished: boolean;
};

export default function TestEditPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;

  const [test, setTest] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch(`/api/admin/tests/${testId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setTest(data.test);
        else setError(data.error || "Ошибка загрузки");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [testId]);

  const toggleQuestion = (idx: number) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const updateMeta = (field: string, value: any) => {
    if (!test) return;
    setTest({ ...test, [field]: value });
    setSaveMessage(null);
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    if (!test) return;
    const questions = [...test.questions];
    questions[idx] = { ...questions[idx], [field]: value };
    setTest({ ...test, questions });
    setSaveMessage(null);
  };

  const updateAnswer = (questionId: string, value: string) => {
    if (!test) return;
    try {
      const parsed = JSON.parse(value);
      setTest({ ...test, answerKey: { ...test.answerKey, [questionId]: parsed } });
      setSaveMessage(null);
    } catch {
      // Игнорируем невалидный JSON пока пользователь печатает
    }
  };

  const updateOptions = (idx: number, optionsStr: string) => {
    if (!test) return;
    const options = optionsStr.split("\n").filter((o) => o.trim());
    updateQuestion(idx, "options", options);
  };

  const deleteQuestion = (idx: number) => {
    if (!test) return;
    const q = test.questions[idx];
    if (!confirm(`Удалить вопрос "${q.text?.slice(0, 50)}..."?`)) return;
    const questions = test.questions.filter((_, i) => i !== idx);
    const answerKey = { ...test.answerKey };
    delete answerKey[q.id];
    setTest({ ...test, questions, answerKey });
    setSaveMessage(null);
  };

  const handleSave = async () => {
    if (!test) return;
    setSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const res = await fetch(`/api/admin/tests/${testId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: test.title,
          description: test.description,
          category: test.category,
          difficultyLevel: test.difficultyLevel,
          basePoints: test.basePoints,
          maxAttempts: test.maxAttempts,
          questions: test.questions,
          answerKey: test.answerKey,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSaveMessage("Сохранено!");
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error && !test) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/admin/tests" className="text-zinc-600 hover:text-zinc-900 underline">Назад</Link>
        </div>
      </div>
    );
  }

  if (!test) return null;

  const questionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      "multiple-choice": "Один ответ",
      "multiple-select": "Несколько ответов",
      "true-false-enhanced": "Верно/Неверно",
      "cloze-dropdown": "Пропуски",
      "select-errors": "Найди ошибки",
      "matching": "Сопоставление",
      "ordering": "Порядок",
      "two-step": "Двухступенчатый",
      "matrix": "Матрица",
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/admin/tests" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Назад к тестам
        </Link>

        {/* Header with actions */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">Редактирование теста</h1>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/tests/${testId}/preview`}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <Eye className="h-4 w-4" />
              Превью
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">{error}</div>
        )}
        {saveMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-700">{saveMessage}</div>
        )}

        {/* Metadata */}
        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-zinc-900 mb-4">Метаданные</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Название</label>
              <input
                type="text"
                value={test.title}
                onChange={(e) => updateMeta("title", e.target.value)}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">ID</label>
              <input
                type="text"
                value={test.id}
                disabled
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm bg-zinc-50 text-zinc-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Описание</label>
              <input
                type="text"
                value={test.description}
                onChange={(e) => updateMeta("description", e.target.value)}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Категория</label>
              <input
                type="text"
                value={test.category}
                onChange={(e) => updateMeta("category", e.target.value)}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Сложность</label>
              <select
                value={test.difficultyLevel}
                onChange={(e) => updateMeta("difficultyLevel", parseInt(e.target.value))}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={1}>1 — Простой</option>
                <option value={2}>2 — Средний</option>
                <option value={3}>3 — Сложный</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Базовые очки</label>
              <input
                type="number"
                value={test.basePoints}
                onChange={(e) => updateMeta("basePoints", parseInt(e.target.value) || 200)}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Макс. попыток (пусто = без лимита)</label>
              <input
                type="number"
                value={test.maxAttempts ?? ""}
                onChange={(e) => updateMeta("maxAttempts", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Без ограничений"
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm p-6">
          <h2 className="font-semibold text-zinc-900 mb-4">
            Вопросы ({test.questions.length})
          </h2>

          <div className="space-y-3">
            {test.questions.map((q, idx) => {
              const isExpanded = expandedQuestions.has(idx);
              return (
                <div key={q.id || idx} className="border border-zinc-200 rounded-lg">
                  {/* Question header (collapsible) */}
                  <button
                    onClick={() => toggleQuestion(idx)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-zinc-50 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                    )}
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-zinc-200 text-zinc-700 text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono flex-shrink-0">{questionTypeLabel(q.type)}</span>
                    <span className="text-sm text-zinc-700 truncate flex-1">{q.text?.slice(0, 80)}{(q.text?.length || 0) > 80 ? "..." : ""}</span>
                  </button>

                  {/* Expanded editor */}
                  {isExpanded && (
                    <div className="border-t border-zinc-200 p-4 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">ID вопроса</label>
                        <input
                          type="text"
                          value={q.id}
                          onChange={(e) => {
                            const oldId = q.id;
                            const newId = e.target.value;
                            updateQuestion(idx, "id", newId);
                            // Также обновляем ключ в answerKey
                            if (test.answerKey[oldId] !== undefined) {
                              const newAnswerKey = { ...test.answerKey };
                              newAnswerKey[newId] = newAnswerKey[oldId];
                              delete newAnswerKey[oldId];
                              setTest((prev) => prev ? { ...prev, answerKey: newAnswerKey } : prev);
                            }
                          }}
                          className="w-full border border-zinc-300 rounded px-2 py-1 text-sm font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Текст вопроса</label>
                        <textarea
                          value={q.text || ""}
                          onChange={(e) => updateQuestion(idx, "text", e.target.value)}
                          rows={3}
                          className="w-full border border-zinc-300 rounded px-2 py-1 text-sm resize-y"
                        />
                      </div>

                      {/* Options (for multiple-choice, multiple-select) */}
                      {(q.type === "multiple-choice" || q.type === "multiple-select") && q.options && (
                        <div>
                          <label className="block text-xs font-medium text-zinc-500 mb-1">
                            Варианты ответов (каждый на новой строке)
                          </label>
                          <textarea
                            value={(q.options || []).join("\n")}
                            onChange={(e) => updateOptions(idx, e.target.value)}
                            rows={Math.max(3, (q.options || []).length)}
                            className="w-full border border-zinc-300 rounded px-2 py-1 text-sm font-mono resize-y"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Подсказка (hint)</label>
                        <textarea
                          value={q.hint || ""}
                          onChange={(e) => updateQuestion(idx, "hint", e.target.value)}
                          rows={2}
                          className="w-full border border-zinc-300 rounded px-2 py-1 text-sm resize-y"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Правильный ответ (JSON)</label>
                        <input
                          type="text"
                          defaultValue={JSON.stringify(test.answerKey[q.id])}
                          onBlur={(e) => updateAnswer(q.id, e.target.value)}
                          className="w-full border border-zinc-300 rounded px-2 py-1 text-sm font-mono"
                        />
                      </div>

                      {/* Raw JSON view for complex types */}
                      {!["multiple-choice", "multiple-select"].includes(q.type) && (
                        <details className="text-xs">
                          <summary className="text-zinc-400 cursor-pointer hover:text-zinc-600">Просмотр полного JSON вопроса</summary>
                          <pre className="mt-2 bg-zinc-50 p-2 rounded text-xs overflow-x-auto max-h-40">
                            {JSON.stringify(q, null, 2)}
                          </pre>
                        </details>
                      )}

                      <div className="pt-2 border-t border-zinc-100">
                        <button
                          onClick={() => deleteQuestion(idx)}
                          className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-3 w-3" />
                          Удалить вопрос
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
