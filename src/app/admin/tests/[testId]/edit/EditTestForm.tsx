"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Eye,
  ChevronDown,
  ChevronRight,
  Loader2,
  Trash2,
  Plus,
  Copy,
  ChevronUp,
  ToggleRight,
  ToggleLeft,
} from "lucide-react";
import {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  defaultAnswerForType,
  normalizeQuestionByType,
  createDefaultQuestion,
  validateTestForSave,
  normalizeAnswerKeyForSave,
} from "@/lib/test-editor-utils";

type TestData = {
  id: string;
  title: string;
  description: string;
  category: string;
  author: string;
  difficultyLevel: number;
  basePoints: number;
  maxAttempts: number | null;
  questions: any[];
  answerKey: Record<string, any>;
  isPublished: boolean;
};

type ValidationError = { field: string; message: string };

const inputClass =
  "w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";
const labelClass = "block text-sm font-medium text-zinc-700 mb-1";

export function EditTestForm({
  test,
  setTest,
  testId,
}: {
  test: TestData;
  setTest: React.Dispatch<React.SetStateAction<TestData | null>>;
  testId: string;
}) {
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);

  const updateMeta = (field: string, value: unknown) => {
    setTest((prev) => (prev ? { ...prev, [field]: value } : prev));
    setSaveMessage(null);
    setValidationErrors([]);
  };

  const updateQuestion = (idx: number, field: string, value: unknown) => {
    setTest((prev) => {
      if (!prev) return prev;
      const questions = [...prev.questions];
      questions[idx] = { ...questions[idx], [field]: value };
      return { ...prev, questions };
    });
    setSaveMessage(null);
    setValidationErrors([]);
  };

  const updateAnswer = (questionId: string, value: unknown) => {
    setTest((prev) =>
      prev ? { ...prev, answerKey: { ...prev.answerKey, [questionId]: value } } : prev
    );
    setSaveMessage(null);
    setValidationErrors([]);
  };

  const updateOptions = (idx: number, optionsStr: string) => {
    const lines = optionsStr.split("\n").map((o) => o.trim());
    const options = lines.filter((o) => o.length > 0);
    updateQuestion(idx, "options", options.length > 0 ? options : [""]);
  };

  const setQuestionType = (idx: number, newType: string) => {
    const q = test.questions[idx];
    const normalized = normalizeQuestionByType(q, newType);
    const answer = defaultAnswerForType(newType, normalized);
    setTest((prev) => {
      if (!prev) return prev;
      const questions = [...prev.questions];
      questions[idx] = normalized;
      return { ...prev, questions, answerKey: { ...prev.answerKey, [q.id]: answer } };
    });
    setSaveMessage(null);
    setValidationErrors([]);
  };

  const addQuestion = (afterIdx?: number) => {
    const ids = new Set(test.questions.map((q) => q.id).filter(Boolean));
    const { id, question } = createDefaultQuestion(ids);
    const insertAt = afterIdx !== undefined ? afterIdx + 1 : test.questions.length;
    setTest((prev) => {
      if (!prev) return prev;
      const questions = [
        ...prev.questions.slice(0, insertAt),
        question,
        ...prev.questions.slice(insertAt),
      ];
      return { ...prev, questions, answerKey: { ...prev.answerKey, [id]: 0 } };
    });
    setExpandedQuestions((prev) => {
      const shifted = prev.map((i) => (i >= insertAt ? i + 1 : i));
      return [...shifted, insertAt];
    });
    setSaveMessage(null);
    setValidationErrors([]);
  };

  const deleteQuestion = (idx: number) => {
    const q = test.questions[idx];
    if (!confirm(`Удалить вопрос "${(q.text || "").slice(0, 50)}..."?`)) return;
    setTest((prev) => {
      if (!prev) return prev;
      const questions = prev.questions.filter((_, i) => i !== idx);
      const answerKey = { ...prev.answerKey };
      delete answerKey[q.id];
      return { ...prev, questions, answerKey };
    });
    setExpandedQuestions((prev) =>
      prev.map((i) => (i < idx ? i : i > idx ? i - 1 : -1)).filter((i) => i >= 0)
    );
    setSaveMessage(null);
    setValidationErrors([]);
  };

  const duplicateQuestion = (idx: number) => {
    const q = test.questions[idx];
    const ids = new Set(test.questions.map((x) => x.id).filter(Boolean));
    let newId = `q${Date.now()}`;
    while (ids.has(newId)) newId = `q-${Math.random().toString(36).slice(2, 8)}`;
    const copy = { ...q, id: newId };
    setTest((prev) =>
      prev
        ? {
            ...prev,
            questions: [
              ...prev.questions.slice(0, idx + 1),
              copy,
              ...prev.questions.slice(idx + 1),
            ],
            answerKey: { ...prev.answerKey, [newId]: prev.answerKey[q.id] },
          }
        : prev
    );
    setExpandedQuestions((prev) => [...prev, idx + 1]);
    setSaveMessage(null);
    setValidationErrors([]);
  };

  const moveQuestion = (idx: number, direction: "up" | "down") => {
    const questions = [...test.questions];
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= questions.length) return;
    [questions[idx], questions[target]] = [questions[target], questions[idx]];
    setTest((prev) => (prev ? { ...prev, questions } : prev));
    setExpandedQuestions((prev) => {
      const i = prev.indexOf(idx);
      const t = prev.indexOf(target);
      if (i >= 0 && t >= 0) {
        const next = [...prev];
        next[i] = target;
        next[t] = idx;
        return next;
      }
      if (i >= 0) return prev.map((x) => (x === idx ? target : x));
      if (t >= 0) return prev.map((x) => (x === target ? idx : x));
      return prev;
    });
    setSaveMessage(null);
  };

  const handleSave = async () => {
    const errs = validateTestForSave(test);
    if (errs.length > 0) {
      setValidationErrors(errs);
      return;
    }
    setValidationErrors([]);
    setSaving(true);
    setError(null);
    setSaveMessage(null);
    try {
      const normalizedAnswerKey = normalizeAnswerKeyForSave(test);
      const res = await fetch(`/api/admin/tests/${testId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: test.title,
          description: test.description,
          category: test.category,
          author: test.author ?? "",
          difficultyLevel: test.difficultyLevel,
          basePoints: test.basePoints,
          maxAttempts: test.maxAttempts,
          questions: test.questions,
          answerKey: normalizedAnswerKey,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSaveMessage("Сохранено!");
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setError(data.error);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tests/${testId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !test.isPublished }),
      });
      const data = await res.json();
      if (data.ok) {
        setTest((prev) => (prev ? { ...prev, isPublished: !prev.isPublished } : prev));
        setSaveMessage(test.isPublished ? "Тест снят с публикации" : "Тест опубликован!");
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setError(data.error || "Ошибка публикации");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
          <Link href="/admin" className="hover:text-zinc-700">Админка</Link>
          <span>/</span>
          <Link href="/admin/tests" className="hover:text-zinc-700">Тесты</Link>
          <span>/</span>
          <span className="text-zinc-900 font-medium truncate max-w-[200px]" title={test.title}>
            Редактирование: {test.title || "Без названия"}
          </span>
        </nav>

        <Link
          href="/admin/tests"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к тестам
        </Link>

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
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="font-medium text-red-800 mb-2">Исправьте ошибки перед сохранением:</p>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {validationErrors.map((e, i) => (
                <li key={i}>
                  {e.field}: {e.message}
                </li>
              ))}
            </ul>
          </div>
        )}
        {saveMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-700">
            {saveMessage}
          </div>
        )}

        {!test.isPublished && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-amber-800 font-medium mb-2">
              Тест не опубликован — он не отображается на главной странице.
            </p>
            <button
              onClick={handlePublish}
              disabled={publishing || test.questions.length === 0}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : test.isPublished ? (
                <ToggleRight className="h-4 w-4" />
              ) : (
                <ToggleLeft className="h-4 w-4" />
              )}
              {publishing ? "Публикация..." : "Опубликовать тест"}
            </button>
          </div>
        )}

        {test.isPublished && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center justify-between">
            <span className="text-sm text-green-800">Тест опубликован и доступен на главной странице.</span>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-green-300 text-green-700 text-sm hover:bg-green-100 disabled:opacity-50"
            >
              <ToggleRight className="h-4 w-4" />
              Снять с публикации
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-zinc-900 mb-4">Метаданные</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Название</label>
              <input
                type="text"
                value={test.title}
                onChange={(e) => updateMeta("title", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>ID</label>
              <input
                type="text"
                value={test.id}
                disabled
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm bg-zinc-50 text-zinc-500"
              />
            </div>
            <div>
              <label className={labelClass}>Описание</label>
              <input
                type="text"
                value={test.description}
                onChange={(e) => updateMeta("description", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Категория</label>
              <input
                type="text"
                value={test.category}
                onChange={(e) => updateMeta("category", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Автор</label>
              <input
                type="text"
                value={test.author ?? ""}
                onChange={(e) => updateMeta("author", e.target.value)}
                placeholder="Денис Колодешников"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Сложность</label>
              <select
                value={test.difficultyLevel}
                onChange={(e) => updateMeta("difficultyLevel", parseInt(e.target.value))}
                className={inputClass}
              >
                <option value={1}>1 — Простой</option>
                <option value={2}>2 — Средний</option>
                <option value={3}>3 — Сложный</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Базовые очки</label>
              <input
                type="number"
                value={test.basePoints}
                onChange={(e) => updateMeta("basePoints", parseInt(e.target.value) || 200)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Макс. попыток (пусто = без лимита)</label>
              <input
                type="number"
                value={test.maxAttempts ?? ""}
                onChange={(e) =>
                  updateMeta("maxAttempts", e.target.value ? parseInt(e.target.value) : null)
                }
                placeholder="Без ограничений"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-900">Вопросы ({test.questions.length})</h2>
            <button
              type="button"
              onClick={() => addQuestion()}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Добавить вопрос
            </button>
          </div>

          {test.questions.length === 0 && (
            <p className="text-zinc-500 text-sm py-4">
              Нет вопросов. Нажмите «Добавить вопрос», чтобы создать первый.
            </p>
          )}

          <div className="space-y-3">
            {test.questions.map((q, idx) => {
              const isExpanded = expandedQuestions.includes(idx);
              return (
                <div key={q.id || idx} className="border border-zinc-200 rounded-lg">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setExpandedQuestions((prev) =>
                          prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
                        )
                      }
                      className="flex-1 flex items-center gap-3 p-3 text-left hover:bg-zinc-50 transition-colors min-w-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                      )}
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-zinc-200 text-zinc-700 text-xs font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono flex-shrink-0">
                        {QUESTION_TYPE_LABELS[q.type] || q.type}
                      </span>
                      <span className="text-sm text-zinc-700 truncate flex-1">
                        {(q.text || "").slice(0, 80)}
                        {(q.text?.length || 0) > 80 ? "..." : ""}
                      </span>
                    </button>
                    <div className="flex items-center flex-shrink-0 pr-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveQuestion(idx, "up");
                        }}
                        disabled={idx === 0}
                        className="p-1.5 rounded text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
                        title="Вверх"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveQuestion(idx, "down");
                        }}
                        disabled={idx === test.questions.length - 1}
                        className="p-1.5 rounded text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
                        title="Вниз"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateQuestion(idx);
                        }}
                        className="p-1.5 rounded text-zinc-400 hover:text-zinc-600"
                        title="Дублировать"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-zinc-200 p-4 space-y-4">
                      <div>
                        <label className={labelClass}>ID вопроса</label>
                        <input
                          type="text"
                          value={q.id}
                          onChange={(e) => {
                            const oldId = q.id;
                            const newId = e.target.value;
                            updateQuestion(idx, "id", newId);
                            if (test.answerKey[oldId] !== undefined) {
                              setTest((prev) => {
                                if (!prev) return prev;
                                const newAnswerKey = { ...prev.answerKey };
                                newAnswerKey[newId] = newAnswerKey[oldId];
                                delete newAnswerKey[oldId];
                                return { ...prev, answerKey: newAnswerKey };
                              });
                            }
                          }}
                          className="w-full border border-zinc-300 rounded px-2 py-1 text-sm font-mono"
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Тип вопроса</label>
                        <select
                          value={q.type}
                          onChange={(e) => setQuestionType(idx, e.target.value)}
                          className={inputClass}
                        >
                          {QUESTION_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {QUESTION_TYPE_LABELS[t] || t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={labelClass}>Текст вопроса</label>
                        <textarea
                          value={q.text || ""}
                          onChange={(e) => updateQuestion(idx, "text", e.target.value)}
                          rows={3}
                          className={`${inputClass} resize-y`}
                        />
                      </div>

                      {(q.type === "multiple-choice" || q.type === "multiple-select") && (
                        <>
                          <div>
                            <label className={labelClass}>
                              Варианты ответов (каждый с новой строки)
                            </label>
                            <textarea
                              value={(q.options || []).join("\n")}
                              onChange={(e) => updateOptions(idx, e.target.value)}
                              rows={Math.max(3, (q.options || []).length)}
                              className={`${inputClass} font-mono resize-y`}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Правильный ответ</label>
                            {q.type === "multiple-choice" ? (
                              <select
                                value={
                                  typeof test.answerKey[q.id] === "number"
                                    ? test.answerKey[q.id]
                                    : 0
                                }
                                onChange={(e) =>
                                  updateAnswer(q.id, parseInt(e.target.value, 10))
                                }
                                className={inputClass}
                              >
                                {(q.options || []).map((opt: string, i: number) => (
                                  <option key={i} value={i}>
                                    Вариант {i + 1}: {(opt || "").slice(0, 60)}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {(q.options || []).map((opt: string, i: number) => {
                                  const arr = Array.isArray(test.answerKey[q.id])
                                    ? test.answerKey[q.id]
                                    : [];
                                  const checked = arr.includes(i);
                                  return (
                                    <label
                                      key={i}
                                      className="flex items-center gap-2 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => {
                                          const next = checked
                                            ? arr.filter((x: number) => x !== i)
                                            : [...arr, i].sort((a, b) => a - b);
                                          updateAnswer(q.id, next);
                                        }}
                                        className="rounded border-zinc-300"
                                      />
                                      <span className="text-sm">
                                        {i + 1}. {(opt || "").slice(0, 50)}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {q.type === "true-false-enhanced" && (
                        <>
                          <div>
                            <label className={labelClass}>Утверждение</label>
                            <textarea
                              value={q.statement ?? ""}
                              onChange={(e) => updateQuestion(idx, "statement", e.target.value)}
                              rows={3}
                              className={`${inputClass} resize-y`}
                              placeholder="Утверждение, которое нужно оценить как верно или неверно"
                            />
                          </div>
                          <div>
                            <label className={labelClass}>
                              Варианты причин (опционально)
                            </label>
                            <p className="text-xs text-zinc-500 mb-1">
                              Оставьте пустым для простого «Верно/Неверно». Пояснение укажите в поле «Подсказка» ниже.
                            </p>
                            <textarea
                              value={(q.reasons || []).filter(Boolean).join("\n")}
                              onChange={(e) => {
                                const lines = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean);
                                updateQuestion(idx, "reasons", lines);
                                if (lines.length === 0 && test.answerKey[q.id]) {
                                  updateAnswer(q.id, { ...test.answerKey[q.id], reason: 0 });
                                }
                              }}
                              rows={2}
                              className={`${inputClass} resize-y`}
                              placeholder="Если нужно — несколько вариантов объяснений, каждый с новой строки"
                            />
                          </div>
                          <div className="flex flex-wrap gap-4">
                            <div>
                              <label className={labelClass}>Правильный ответ: Верно/Неверно</label>
                              <select
                                value={
                                  test.answerKey[q.id]?.answer === false ? "false" : "true"
                                }
                                onChange={(e) =>
                                  updateAnswer(q.id, {
                                    ...(test.answerKey[q.id] || { answer: true, reason: 0 }),
                                    answer: e.target.value === "true",
                                    reason: (q.reasons || []).length > 0 ? (test.answerKey[q.id]?.reason ?? 0) : 0,
                                  })
                                }
                                className={inputClass}
                              >
                                <option value="true">Верно</option>
                                <option value="false">Неверно</option>
                              </select>
                            </div>
                            {(q.reasons || []).length > 0 && (
                              <div>
                                <label className={labelClass}>Причина (индекс)</label>
                                <select
                                  value={
                                    typeof test.answerKey[q.id]?.reason === "number"
                                      ? test.answerKey[q.id].reason
                                      : 0
                                  }
                                  onChange={(e) =>
                                    updateAnswer(q.id, {
                                      ...(test.answerKey[q.id] || { answer: true, reason: 0 }),
                                      reason: parseInt(e.target.value, 10),
                                    })
                                  }
                                  className={inputClass}
                                >
                                  {(q.reasons || []).map((r: string, i: number) => (
                                    <option key={i} value={i}>
                                      {i + 1}: {(r || "").slice(0, 40)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {q.type === "cloze-dropdown" && (
                        <>
                          <p className="text-xs text-zinc-500">
                            В тексте используйте [1], [2] для пропусков.
                          </p>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className={labelClass}>Пропуски</label>
                              <button
                                type="button"
                                onClick={() => {
                                  const gaps = [...(q.gaps || [])];
                                  gaps.push({ index: gaps.length, options: [""] });
                                  updateQuestion(idx, "gaps", gaps);
                                  const arr = Array.isArray(test.answerKey[q.id])
                                    ? [...test.answerKey[q.id]]
                                    : (q.gaps || []).map(() => 0);
                                  updateAnswer(q.id, [...arr, 0]);
                                }}
                                className="text-xs text-zinc-600 hover:text-zinc-900"
                              >
                                + Добавить пропуск
                              </button>
                            </div>
                            {(q.gaps || []).map((gap: { options?: string[] }, gi: number) => (
                              <div key={gi} className="mb-3 p-2 bg-zinc-50 rounded">
                                <span className="text-xs text-zinc-500">Пропуск {gi + 1}</span>
                                <label className="block text-xs text-zinc-600 mt-1">
                                  Варианты для подстановки (каждый с новой строки или через запятую):
                                </label>
                                <textarea
                                  value={(gap.options || []).join("\n")}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    const options = raw
                                      .split(/\n|[,;]/)
                                      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
                                      .filter(Boolean);
                                    const gaps = [...(q.gaps || [])];
                                    gaps[gi] = {
                                      ...gaps[gi],
                                      index: gi,
                                      options: options.length > 0 ? options : [""],
                                    };
                                    updateQuestion(idx, "gaps", gaps);
                                  }}
                                  rows={3}
                                  className="mt-1 w-full border rounded px-2 py-1 text-sm"
                                  placeholder={'ниже\nзанимает\nувеличивает   или   ниже, занимает, увеличивает'}
                                />
                                <label className="mt-1 block text-xs">
                                  Правильный ответ:{" "}
                                  <select
                                    value={
                                      Array.isArray(test.answerKey[q.id])
                                        ? test.answerKey[q.id][gi] ?? 0
                                        : 0
                                    }
                                    onChange={(e) => {
                                      const arr = Array.isArray(test.answerKey[q.id])
                                        ? [...test.answerKey[q.id]]
                                        : (q.gaps || []).map(() => 0);
                                      arr[gi] = parseInt(e.target.value, 10);
                                      updateAnswer(q.id, arr);
                                    }}
                                    className="ml-1 border rounded px-1"
                                  >
                                    {(gap.options || []).map((_: string, oi: number) => (
                                      <option key={oi} value={oi}>
                                        {oi + 1}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {q.type === "matching" && (
                        <>
                          <div>
                            <label className={labelClass}>
                              Левый столбец (каждый с новой строки)
                            </label>
                            <textarea
                              value={(q.leftItems || []).join("\n")}
                              onChange={(e) =>
                                updateQuestion(
                                  idx,
                                  "leftItems",
                                  e.target.value.split("\n").map((s) => s.trim()).filter(Boolean)
                                )
                              }
                              rows={4}
                              className={`${inputClass} resize-y`}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>
                              Правый столбец (каждый с новой строки)
                            </label>
                            <textarea
                              value={(q.rightItems || []).join("\n")}
                              onChange={(e) =>
                                updateQuestion(
                                  idx,
                                  "rightItems",
                                  e.target.value.split("\n").map((s) => s.trim()).filter(Boolean)
                                )
                              }
                              rows={4}
                              className={`${inputClass} resize-y`}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Пары: левый → правый</label>
                            <p className="text-xs text-zinc-500 mb-1">
                              Ключ «1-A, 2-C, 3-B»: левый 1→A(индекс 0), 2→C(индекс 2), 3→B(индекс 1). Сохраняется как [[0,0],[1,2],[2,1]].
                            </p>
                            <div className="space-y-2">
                              {(q.leftItems || []).map((left: string, li: number) => (
                                <div key={li} className="flex items-center gap-2">
                                  <span className="text-sm w-8">{li + 1}.</span>
                                  <span className="text-zinc-600 truncate flex-1 max-w-[200px]">
                                    {(left || "").slice(0, 30)}
                                  </span>
                                  <span className="text-zinc-400">→</span>
                                  <select
                                    value={
                                      (Array.isArray(test.answerKey[q.id])
                                        ? (
                                            test.answerKey[q.id] as [number, number][]
                                          ).find((p) => p[0] === li)?.[1] ?? 0
                                        : 0) as number
                                    }
                                    onChange={(e) => {
                                      const existing = (
                                        Array.isArray(test.answerKey[q.id])
                                          ? (test.answerKey[q.id] as [number, number][])
                                          : []
                                      );
                                      const newRight = parseInt(e.target.value, 10);
                                      const leftCount = (q.leftItems || []).length;
                                      const pairs: [number, number][] = [];
                                      for (let i = 0; i < leftCount; i++) {
                                        const right = i === li
                                          ? newRight
                                          : (existing.find((p) => p[0] === i)?.[1] ?? 0);
                                        pairs.push([i, right]);
                                      }
                                      pairs.sort((a, b) => a[0] - b[0]);
                                      updateAnswer(q.id, pairs);
                                    }}
                                    className="border rounded px-2 py-1 text-sm"
                                  >
                                    {(q.rightItems || []).map((r: string, ri: number) => (
                                      <option key={ri} value={ri}>
                                        {ri + 1}. {(r || "").slice(0, 40)}{(r?.length || 0) > 40 ? "…" : ""}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {q.type === "ordering" && (
                        <>
                          <div>
                            <label className={labelClass}>
                              Элементы (каждый с новой строки)
                            </label>
                            <textarea
                              value={(q.items || []).join("\n")}
                              onChange={(e) =>
                                updateQuestion(
                                  idx,
                                  "items",
                                  e.target.value.split("\n").map((s) => s.trim())
                                )
                              }
                              rows={5}
                              className={`${inputClass} resize-y`}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>
                              Правильный порядок
                            </label>
                            <p className="text-xs text-zinc-500 mb-1">
                              Ключ «2-1-3-4» → введите <code className="bg-zinc-100 px-1">2, 1, 3, 4</code> (номера с 1), система преобразует в индексы.
                            </p>
                            <input
                              type="text"
                              value={
                                Array.isArray(test.answerKey[q.id])
                                  ? (test.answerKey[q.id] as number[]).map((x) => x + 1).join(", ")
                                  : (q.items || []).map((_: string, i: number) => i + 1).join(", ")
                              }
                              onChange={(e) => {
                                const raw = e.target.value.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !Number.isNaN(n));
                                const n = (q.items || []).length;
                                const parsed =
                                  n > 0 && raw.length === n && raw.every((x) => x >= 1 && x <= n)
                                    ? raw.map((x) => x - 1)
                                    : raw.filter((x) => x >= 0 && x < n);
                                updateAnswer(q.id, parsed);
                              }}
                              className={inputClass}
                              placeholder="2, 1, 3, 4  или  1, 0, 2, 3"
                            />
                          </div>
                        </>
                      )}

                      {q.type === "select-errors" && (
                        <>
                          <div>
                            <label className={labelClass}>Утверждение (content)</label>
                            <textarea
                              value={(q.content ?? q.text ?? "").toString()}
                              onChange={(e) => {
                                const v = e.target.value;
                                updateQuestion(idx, "content", v);
                                if (!q.text?.trim()) updateQuestion(idx, "text", "Найди ошибки в утверждении.");
                              }}
                              rows={4}
                              className={`${inputClass} resize-y`}
                              placeholder="Текст с ошибками для выбора"
                            />
                          </div>
                          <div>
                            <label className={labelClass}>
                              Фрагменты для выбора (каждый с новой строки — точный текст)
                            </label>
                            <p className="text-xs text-zinc-500 mb-1">
                              Укажите фрагменты, которые должны быть кликабельны. Система найдёт их в тексте и создаст markedParts.
                            </p>
                            <textarea
                              value={(q.markedParts || []).map((p: { text?: string }) => p.text || "").join("\n")}
                              onChange={(e) => {
                                const lines = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean);
                                const content = q.content || "";
                                const markedParts: Array<{ id: number; text: string; start: number; end: number }> = [];
                                let searchFrom = 0;
                                lines.forEach((text, i) => {
                                  const pos = content.indexOf(text, searchFrom);
                                  if (pos >= 0) {
                                    markedParts.push({
                                      id: i + 1,
                                      text,
                                      start: pos,
                                      end: pos + text.length,
                                    });
                                    searchFrom = pos + text.length;
                                  } else {
                                    markedParts.push({ id: i + 1, text, start: 0, end: text.length });
                                  }
                                });
                                updateQuestion(idx, "markedParts", markedParts);
                              }}
                              rows={4}
                              className={`${inputClass} font-mono text-sm`}
                              placeholder={'перекарбонизации\nмаксимально возможном давлении\nнезависимо от температуры'}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Можно выбрать несколько</label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={!!q.allowMultiple}
                                onChange={(e) => updateQuestion(idx, "allowMultiple", e.target.checked)}
                                className="rounded border-zinc-300"
                              />
                              <span className="text-sm">Да (несколько ошибок)</span>
                            </label>
                          </div>
                          <div>
                            <label className={labelClass}>Правильные ошибки (отметьте ID фрагментов)</label>
                            <p className="text-xs text-zinc-500 mb-1">
                              Выберите, какие фрагменты являются ошибками. ID = номер строки (1, 2, 3…).
                            </p>
                            <div className="flex flex-wrap gap-3">
                              {(q.markedParts || []).map((p: { id?: number; text?: string }, pi: number) => {
                                const pid = p.id ?? pi + 1;
                                const arr = Array.isArray(test.answerKey[q.id]) ? (test.answerKey[q.id] as number[]) : [];
                                const checked = arr.includes(pid);
                                return (
                                  <label key={pid} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {
                                        const next = checked
                                          ? arr.filter((x) => x !== pid)
                                          : [...arr, pid].sort((a, b) => a - b);
                                        updateAnswer(q.id, next);
                                      }}
                                      className="rounded border-zinc-300"
                                    />
                                    <span className="text-sm">
                                      {pid}. {(p.text || "").slice(0, 30)}{(p.text?.length || 0) > 30 ? "…" : ""}
                                    </span>
                                  </label>
                                );
                              })}
                              {(q.markedParts || []).length === 0 && (
                                <span className="text-sm text-zinc-400">Сначала добавьте фрагменты выше</span>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {![
                        "multiple-choice",
                        "multiple-select",
                        "true-false-enhanced",
                        "cloze-dropdown",
                        "matching",
                        "ordering",
                        "select-errors",
                      ].includes(q.type) && (
                        <div>
                          <label className={labelClass}>Правильный ответ (JSON)</label>
                          <input
                            type="text"
                            value={JSON.stringify(test.answerKey[q.id])}
                            onChange={(e) => {
                              try {
                                updateAnswer(q.id, JSON.parse(e.target.value));
                              } catch {
                                /* ignore */
                              }
                            }}
                            className={`${inputClass} font-mono`}
                          />
                        </div>
                      )}

                      <div>
                        <label className={labelClass}>Подсказка (hint)</label>
                        <textarea
                          value={q.hint || ""}
                          onChange={(e) => updateQuestion(idx, "hint", e.target.value)}
                          rows={2}
                          className={`${inputClass} resize-y`}
                        />
                      </div>

                      <div className="pt-2 border-t border-zinc-100 flex items-center gap-3 flex-wrap">
                        <button
                          type="button"
                          onClick={() => addQuestion(idx)}
                          className="inline-flex items-center gap-1 text-sm text-zinc-700 hover:text-zinc-900 font-medium"
                        >
                          <Plus className="h-3 w-3" />
                          Добавить вопрос
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteQuestion(idx)}
                          className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
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
