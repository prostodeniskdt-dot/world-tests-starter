"use client";

import { useMemo, useState, useEffect } from "react";
import { UserGate, useLocalUser } from "@/components/UserGate";
import { CheckCircle2, Circle, ArrowRight, Award } from "lucide-react";
import { addToast } from "./Toast";

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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showNavigation, setShowNavigation] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const answeredCount = useMemo(() => {
    return Object.values(answers).filter(v => v !== null).length;
  }, [answers]);

  const progressPercent = (answeredCount / test.questions.length) * 100;

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    const element = document.getElementById(`question-${index}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < test.questions.length - 1) {
      goToQuestion(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      goToQuestion(currentQuestionIndex - 1);
    }
  };

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
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 shadow-soft p-6">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          {test.title}
        </h1>
        {test.description && (
          <p className="mt-2 text-zinc-400 text-lg leading-relaxed">{test.description}</p>
        )}
      </div>

      {/* Прогресс-бар */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 shadow-soft p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-200">
            Прогресс: {answeredCount} / {test.questions.length} вопросов
          </span>
          <span className="text-sm font-semibold text-white">{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full bg-zinc-700 rounded-full h-3 overflow-hidden">
          <div 
            className="gradient-primary h-full rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Навигация по вопросам */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 shadow-soft p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-zinc-200">Навигация по вопросам</span>
          <button
            onClick={() => setShowNavigation(!showNavigation)}
            className="text-xs text-white hover:text-zinc-400 transition-colors"
          >
            {showNavigation ? 'Скрыть' : 'Показать'}
          </button>
        </div>
        {showNavigation && (
          <div className="flex flex-wrap gap-2">
            {test.questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== null;
              const isCurrent = idx === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(idx)}
                  className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                    isCurrent
                      ? 'bg-white text-white ring-2 ring-zinc-600'
                      : isAnswered
                      ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                  aria-label={`Вопрос ${idx + 1}${isAnswered ? ', отвечен' : ', не отвечен'}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <UserGate title="Для прохождения теста необходима регистрация">
        {(user) => (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 shadow-soft p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200">
              <div className="text-sm text-zinc-400">
                Вы: <span className="font-semibold text-zinc-100">{user.firstName} {user.lastName}</span>
              </div>

              {attemptsInfo && attemptsInfo.max !== null && (
                <div className="text-sm text-zinc-400 px-3 py-1 bg-amber-950 border border-amber-800 rounded-lg">
                  Попыток: {attemptsInfo.used} / {attemptsInfo.max}
                </div>
              )}
            </div>

            <div className="space-y-8">
              {test.questions.map((q, idx) => (
                <div key={q.id} id={`question-${idx}`} className="border-t border-zinc-800 pt-6 first:border-t-0 first:pt-0">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="font-semibold text-lg text-zinc-100 leading-relaxed flex-1">
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
                              ? "border-zinc-9000 bg-zinc-900 shadow-md"
                              : "border-zinc-200 hover:border-zinc-600 hover:bg-zinc-800"
                          }`}
                          aria-label={`Вариант ответа ${optIdx + 1}: ${opt}`}
                        >
                          <div className="flex-shrink-0">
                            {checked ? (
                              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                                <CheckCircle2 className="h-4 w-4 text-white" aria-hidden="true" />
                              </div>
                            ) : (
                              <Circle className="h-5 w-5 text-zinc-400" aria-hidden="true" />
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
                            aria-label={`Выбрать вариант ${optIdx + 1}`}
                          />
                          <span className="text-zinc-200 flex-1" aria-hidden="true">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-4 pt-4 border-t border-zinc-800">
                    <button
                      onClick={prevQuestion}
                      disabled={idx === 0}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-600 bg-zinc-900 text-white hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                      aria-label="Предыдущий вопрос"
                    >
                      ← Предыдущий
                    </button>
                    <button
                      onClick={nextQuestion}
                      disabled={idx === test.questions.length - 1}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-600 bg-zinc-900 text-white hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                      aria-label="Следующий вопрос"
                    >
                      Следующий →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-200 flex items-center gap-4">
              <button
                disabled={!allAnswered || submitting}
                onClick={() => setShowConfirmModal(true)}
                className="inline-flex items-center gap-2 rounded-lg gradient-primary px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
              >
                {submitting ? "Отправляем..." : "Завершить тест"}
                {!submitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
              </button>

              {!allAnswered && (
                <div className="text-sm text-zinc-500">
                  Ответьте на все вопросы, чтобы отправить результат
                </div>
              )}
            </div>

            {/* Модальное окно подтверждения */}
            {showConfirmModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
                  <h3 className="text-xl font-bold mb-4">Подтверждение отправки</h3>
                  <p className="text-zinc-400 mb-4">
                    Вы ответили на {answeredCount} из {test.questions.length} вопросов. 
                    Вы уверены, что хотите завершить тест?
                  </p>
                  {!allAnswered && (
                    <div className="mb-6 p-3 bg-amber-950 border border-amber-800 rounded-lg">
                      <p className="text-sm font-medium text-amber-800 mb-2">
                        Внимание: есть неотвеченные вопросы!
                      </p>
                      <p className="text-xs text-amber-700">
                        Неотвеченные вопросы: {test.questions
                          .map((q, qIdx) => ({ q, qIdx }))
                          .filter(({ q }) => answers[q.id] === null)
                          .map(({ qIdx }) => qIdx + 1)
                          .join(", ")}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        setShowConfirmModal(false);
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
                          if (json.ok) {
                            addToast("Тест успешно отправлен!", "success");
                          } else {
                            addToast(json.error || "Ошибка отправки теста", "error");
                          }
                        } catch (e) {
                          const errorMsg = "Сеть/сервер недоступны. Попробуй ещё раз.";
                          setResult({
                            ok: false,
                            error: errorMsg,
                          });
                          addToast(errorMsg, "error");
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                      className="flex-1 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-all"
                    >
                      Да, завершить
                    </button>
                    <button
                      onClick={() => setShowConfirmModal(false)}
                      className="flex-1 rounded-lg border px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            )}

            {result ? (
              <div className={`mt-6 rounded-xl border-2 p-6 ${
                result.ok 
                  ? "border-success bg-green-50" 
                  : "border-error bg-red-50"
              }`}>
                {result.ok ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Award className="h-6 w-6 text-success" aria-hidden="true" />
                      <div className="font-bold text-lg text-zinc-100">Результат отправлен ✅</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-zinc-900 rounded-lg p-3 border border-green-200">
                        <div className="text-zinc-400 mb-1">Правильных ответов</div>
                        <div className="font-bold text-lg text-zinc-100">
                          {result.result.correctCount} / {result.result.totalQuestions}
                        </div>
                        <div className="text-success font-semibold">{result.result.scorePercent}%</div>
                      </div>
                      <div className="bg-zinc-900 rounded-lg p-3 border border-green-200">
                        <div className="text-zinc-400 mb-1">Очки за попытку</div>
                        <div className="font-bold text-2xl text-white">
                          +{result.result.pointsAwarded}
                        </div>
                      </div>
                    </div>
                    <div className="bg-zinc-900 rounded-lg p-4 border border-green-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-zinc-400">Всего очков</div>
                          <div className="font-bold text-xl text-zinc-100">{result.result.totalPoints}</div>
                        </div>
                        <div>
                          <div className="text-sm text-zinc-400">Тестов пройдено</div>
                          <div className="font-bold text-xl text-zinc-100">{result.result.testsCompleted}</div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2">
                      <a
                        href="/leaderboard"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-zinc-400 underline"
                      >
                        Перейти в рейтинг
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
