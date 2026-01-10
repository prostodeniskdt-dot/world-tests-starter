"use client";

import { useMemo, useState } from "react";
import type { PublicTest } from "@/tests/test-1.public";
import { UserGate } from "@/components/UserGate";

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

  return (
    <div className="space-y-6">
      <div className="rounded-md border bg-white p-4">
        <h1 className="text-2xl font-bold">{test.title}</h1>
        <p className="mt-1 text-zinc-600">{test.description}</p>
      </div>

      <UserGate title="Никнейм для рейтинга">
        {(user) => (
          <div className="rounded-md border bg-white p-4">
            <div className="text-sm text-zinc-600">
              Вы: <span className="font-medium text-zinc-900">{user.username}</span>
            </div>

            <div className="mt-6 space-y-6">
              {test.questions.map((q, idx) => (
                <div key={q.id} className="border-t pt-4 first:border-t-0 first:pt-0">
                  <div className="font-medium">
                    {idx + 1}. {q.text}
                  </div>
                  <div className="mt-2 space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const checked = answers[q.id] === optIdx;
                      return (
                        <label
                          key={optIdx}
                          className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 hover:bg-zinc-50"
                        >
                          <input
                            type="radio"
                            name={q.id}
                            checked={checked}
                            onChange={() =>
                              setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                            }
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                disabled={!allAnswered || submitting}
                onClick={async () => {
                  setSubmitting(true);
                  setResult(null);
                  try {
                    const res = await fetch("/api/submit", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userId: user.userId,
                        username: user.username,
                        testId: test.id,
                        answers,
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
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {submitting ? "Отправляем..." : "Завершить тест"}
              </button>

              {!allAnswered ? (
                <div className="text-sm text-zinc-500">
                  Ответь на все вопросы, чтобы отправить результат.
                </div>
              ) : null}
            </div>

            {result ? (
              <div className="mt-5 rounded-md border p-4">
                {result.ok ? (
                  <div className="space-y-1">
                    <div className="font-medium">Результат отправлен ✅</div>
                    <div className="text-sm text-zinc-700">
                      Правильных: {result.result.correctCount} /{" "}
                      {result.result.totalQuestions} (
                      {result.result.scorePercent}%)
                    </div>
                    <div className="text-sm text-zinc-700">
                      Очки за попытку:{" "}
                      <span className="font-medium">{result.result.pointsAwarded}</span>
                    </div>
                    <div className="text-sm text-zinc-700">
                      Всего очков:{" "}
                      <span className="font-medium">{result.result.totalPoints}</span>, тестов
                      пройдено:{" "}
                      <span className="font-medium">{result.result.testsCompleted}</span>
                    </div>
                    <div className="pt-2">
                      <a
                        href="/leaderboard"
                        className="text-sm font-medium text-zinc-900 underline"
                      >
                        Перейти в рейтинг →
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-red-700">
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
