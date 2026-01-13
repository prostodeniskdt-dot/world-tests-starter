"use client";

import { useMemo, useState, useEffect } from "react";
import { UserGate, useLocalUser } from "@/components/UserGate";
import { CheckCircle2, Circle, ArrowRight, Award } from "lucide-react";

type PublicTest = {
  id: string;
  title: string;
  description: string | null;
  questions: Array<{
    id: string;
    text: string;
    options: string[];
  }>;
};

type SubmitResponse =
  | {
      ok: true;
      result: {
        testId: string;
        correctCount: number;
        totalQuestions: number;
        scorePercent: number;
        pointsAwarded: number;
        totalPoints: number;
        testsCompleted: number;
      };
    }
  | { ok: false; error: string };

export function TestClient({ test }: { test: PublicTest }) {
  const [answers, setAnswers] = useState<Record<string, number | null>>(() => {
    const init: Record<string, number | null> = {};
    for (const q of test.questions) init[q.id] = null;
    return init;
  });

  const allAnswered = useMemo(
    () => Object.values(answers).every((v) => v !== null),
    [answers]
  );

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [startTime] = useState(new Date().toISOString());
  const [attemptsInfo, setAttemptsInfo] = useState<{
    used: number;
    max: number | null;
  } | null>(null);
  const { user: currentUser } = useLocalUser();

  const answeredCount = useMemo(() => {
    return Object.values(answers).filter(v => v !== null).length;
  }, [answers]);

  const progressPercent = (answeredCount / test.questions.length) * 100;

  useEffect(() => {
    if (currentUser?.userId) {
      fetch(`/api/tests/${test.id}/attempts?userId=${currentUser.userId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setAttemptsInfo(data);
          }
        })
        .catch(() => {});
    }
  }, [test.id, currentUser?.userId]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-6">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
          {test.title}
        </h1>
        {test.description && (
          <p className="mt-2 text-zinc-600 text-lg leading-relaxed">{test.description}</p>
        )}
      </div>

      {/* Прогресс-бар */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-700">
            Прогресс: {answeredCount} / {test.questions.length} вопросов
          </span>
          <span className="text-sm font-semibold text-primary-600">{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full bg-zinc-200 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      <UserGate title="Для прохождения теста необходима регистрация">
        {(user) => (
          <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200">
              <div className="text-sm text-zinc-600">
                Вы: <span className="font-semibold text-zinc-900">{user.firstName} {user.lastName}</span>
              </div>

              {attemptsInfo && attemptsInfo.max !== null && (
                <div className="text-sm text-zinc-600 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg">
                  Попыток: {attemptsInfo.used} / {attemptsInfo.max}
                </div>
              )}
            </div>

            <div className="space-y-8">
              {test.questions.map((q, idx) => (
                <div key={q.id} className="border-t border-zinc-100 pt-6 first:border-t-0 first:pt-0">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="font-semibold text-lg text-zinc-900 leading-relaxed flex-1">
                      {q.text}
                    </div>
                  </div>
                  <div className="ml-11 space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const checked = answers[q.id] === optIdx;
                      return (
                        <label
                          key={optIdx}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition-all ${
                            checked
                              ? "border-primary-500 bg-primary-50 shadow-md"
                              : "border-zinc-200 hover:border-primary-300 hover:bg-zinc-50"
                          }`}
                        >
                          <div className="flex-shrink-0">
                            {checked ? (
                              <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                                <CheckCircle2 className="h-4 w-4 text-white" />
                              </div>
                            ) : (
                              <Circle className="h-5 w-5 text-zinc-400" />
                            )}
                          </div>
                          <input
                            type="radio"
                            name={q.id}
                            checked={checked}
                            onChange={() =>
                              setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                            }
                            className="hidden"
                          />
                          <span className="text-zinc-700 flex-1">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-200 flex items-center gap-4">
              <button
                disabled={!allAnswered || submitting}
                onClick={async () => {
                  setSubmitting(true);
                  setResult(null);
                  const endTime = new Date().toISOString();
                  try {
                    const res = await fetch("/api/submit", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userId: user.userId,
                        testId: test.id,
                        answers,
                        startTime,
                        endTime,
                      }),
                    });
                    const json = (await res.json()) as SubmitResponse;
                    setResult(json);
                  } catch (e) {
                    setResult({
                      ok: false,
                      error: "Сеть/сервер недоступны. Попробуй ещё раз.",
                    });
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
              >
                {submitting ? "Отправляем..." : "Завершить тест"}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </button>

              {!allAnswered && (
                <div className="text-sm text-zinc-500">
                  Ответьте на все вопросы, чтобы отправить результат
                </div>
              )}
            </div>

            {result ? (
              <div className={`mt-6 rounded-xl border-2 p-6 ${
                result.ok 
                  ? "border-success bg-green-50" 
                  : "border-error bg-red-50"
              }`}>
                {result.ok ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Award className="h-6 w-6 text-success" />
                      <div className="font-bold text-lg text-zinc-900">Результат отправлен ✅</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="text-zinc-600 mb-1">Правильных ответов</div>
                        <div className="font-bold text-lg text-zinc-900">
                          {result.result.correctCount} / {result.result.totalQuestions}
                        </div>
                        <div className="text-success font-semibold">{result.result.scorePercent}%</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="text-zinc-600 mb-1">Очки за попытку</div>
                        <div className="font-bold text-2xl text-primary-600">
                          +{result.result.pointsAwarded}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-zinc-600">Всего очков</div>
                          <div className="font-bold text-xl text-zinc-900">{result.result.totalPoints}</div>
                        </div>
                        <div>
                          <div className="text-sm text-zinc-600">Тестов пройдено</div>
                          <div className="font-bold text-xl text-zinc-900">{result.result.testsCompleted}</div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2">
                      <a
                        href="/leaderboard"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 underline"
                      >
                        Перейти в рейтинг
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-error font-medium">
                    Ошибка: {result.error}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </UserGate>
    </div>
  );
}
