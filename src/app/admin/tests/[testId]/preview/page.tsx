"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, Edit, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { QuestionRenderer } from "@/components/questions/QuestionRenderer";
import type { PublicTestQuestion, QuestionAnswer } from "@/tests/types";

type TestData = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficultyLevel: number;
  basePoints: number;
  maxAttempts: number | null;
  questions: PublicTestQuestion[];
  answerKey: Record<string, any>;
  isPublished: boolean;
};

export default function TestPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;

  const [test, setTest] = useState<TestData | null>(null);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/tests/${testId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setTest(data.test);
        } else {
          setError(data.error || "Ошибка загрузки");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [testId]);

  const togglePublish = async () => {
    if (!test) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/admin/tests/${testId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !test.isPublished }),
      });
      const data = await res.json();
      if (data.ok) {
        setTest({ ...test, isPublished: !test.isPublished });
      }
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Тест не найден"}</p>
          <Link href="/admin/tests" className="text-zinc-600 hover:text-zinc-900 underline">
            Назад к тестам
          </Link>
        </div>
      </div>
    );
  }

  const difficultyLabel = { 1: "Простой", 2: "Средний", 3: "Сложный" }[test.difficultyLevel] || "?";

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/admin/tests" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Назад к тестам
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Eye className="h-5 w-5 text-primary-600" />
                <span className="text-sm font-medium text-primary-600">Превью</span>
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 mb-1">{test.title}</h1>
              <p className="text-zinc-500 text-sm">
                {test.category} • {difficultyLabel} • {test.questions.length} вопросов • {test.basePoints} очков
              </p>
              {test.description && (
                <p className="text-zinc-600 text-sm mt-2">{test.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href={`/admin/tests/${testId}/edit`}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Редактировать
              </Link>
              <button
                onClick={togglePublish}
                disabled={publishing}
                className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  test.isPublished
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-zinc-900 text-white hover:bg-zinc-800"
                }`}
              >
                {test.isPublished ? (
                  <>
                    <ToggleRight className="h-4 w-4" />
                    Опубликован
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-4 w-4" />
                    Опубликовать
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Questions preview */}
        <div className="space-y-6">
          {test.questions.map((question, index) => (
            <div
              key={question.id}
              className="bg-white rounded-lg border border-zinc-200 shadow-sm p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-zinc-900 text-white text-sm font-bold">
                  {index + 1}
                </span>
                <span className="text-xs text-zinc-400 font-mono">{question.type}</span>
                <span className="text-xs text-zinc-400 font-mono">id: {question.id}</span>
              </div>

              <QuestionRenderer
                question={question}
                answer={answers[question.id] ?? null}
                onChange={(val) =>
                  setAnswers((prev) => ({ ...prev, [question.id]: val }))
                }
                disabled={false}
                showHint={false}
              />

              {/* Show correct answer */}
              <div className="mt-4 pt-3 border-t border-zinc-100">
                <div className="text-xs text-zinc-400">
                  Правильный ответ: <code className="bg-zinc-100 px-1 rounded">{JSON.stringify(test.answerKey[question.id])}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
