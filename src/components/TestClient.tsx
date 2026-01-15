"use client";

import { useMemo, useState, useEffect } from "react";
import { UserGate, useLocalUser } from "@/components/UserGate";
import { ArrowRight, Award } from "lucide-react";
import { addToast } from "./Toast";
import { NavigateToLeaderboard } from "./NavigateToLeaderboard";
import { QuestionRenderer } from "./questions/QuestionRenderer";
import type { PublicTest } from "@/lib/tests-registry";
import type { QuestionAnswer } from "@/tests/types";

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
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer | null>>(() => {
    const init: Record<string, QuestionAnswer | null> = {};
    for (const q of test.questions) init[q.id] = null;
    return init;
  });

  const [answeredHints, setAnsweredHints] = useState<Record<string, boolean>>({});
  const [hintResults, setHintResults] = useState<Record<string, boolean>>({});

  const allAnswered = useMemo(() => {
    return Object.values(answers).every((v) => {
      if (v === null) return false;
      // Проверяем, что ответ не пустой массив или пустой объект
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "object") {
        return Object.keys(v).length > 0;
      }
      return true;
    });
  }, [answers]);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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

  // Функция для проверки ответа на клиенте (для показа справки)
  const checkAnswerLocally = async (questionId: string, answer: QuestionAnswer) => {
    try {
      const res = await fetch(`/api/tests/${test.id}/check-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answer }),
      });
      const data = await res.json();
      return data.ok && data.correct;
    } catch {
      return false;
    }
  };

  // Защита от обновления страницы
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (answeredCount > 0 && !result && !submitted) {
        e.preventDefault();
        e.returnValue = "Вы уверены? Ваш прогресс будет потерян.";
        return e.returnValue;
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [answeredCount, result, submitted]);

  useEffect(() => {
    if (currentUser?.userId) {
      // userId больше не передается в query, берется из JWT токена для безопасности
      fetch(`/api/tests/${test.id}/attempts`)
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
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-4 sm:space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-4 sm:p-6">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            {test.title}
          </h1>
          <div className="flex items-center gap-1" title={`Сложность: ${test.difficultyLevel} из 3`}>
            {Array.from({ length: test.difficultyLevel }).map((_, i) => (
              <span key={i} className="text-amber-600 text-lg sm:text-xl" aria-label={`Барная ложка ${i + 1}`}>
                🥄
              </span>
            ))}
          </div>
        </div>
        {test.description && (
          <p className="mt-2 text-zinc-600 text-sm sm:text-base md:text-lg leading-relaxed">{test.description}</p>
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
            className="gradient-primary h-full rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Навигация по вопросам */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-zinc-700">Навигация по вопросам</span>
          <button
            onClick={() => setShowNavigation(!showNavigation)}
            className="text-xs text-primary-600 hover:text-zinc-600 transition-colors"
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
                  className={`w-12 h-12 sm:w-10 sm:h-10 rounded-lg text-sm font-semibold transition-all ${
                    isCurrent
                      ? 'bg-primary-600 text-white ring-2 ring-primary-300'
                      : isAnswered
                      ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
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
          <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6 pb-4 border-b border-zinc-200">
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
              {test.questions.map((q, idx) => {
                const showHint = answeredHints[q.id] && q.hint;
                const isCorrect = hintResults[q.id];
                
                return (
                  <div key={q.id} id={`question-${idx}`} className="border-t border-zinc-200 pt-6 first:border-t-0 first:pt-0">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="font-semibold text-base sm:text-lg text-zinc-900 leading-relaxed flex-1">
                        {q.text}
                      </div>
                    </div>
                    <div className="ml-0 sm:ml-11">
                      <QuestionRenderer
                        question={q}
                        answer={answers[q.id]}
                        onChange={(answer) => {
                          if (submitted || submitting) return;
                          setAnswers((prev) => ({ ...prev, [q.id]: answer }));
                        }}
                        disabled={submitted}
                        showHint={!!showHint}
                        isCorrect={isCorrect}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0 mt-4 pt-4 border-t border-zinc-200">
                      <button
                        onClick={prevQuestion}
                        disabled={idx === 0}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary-300 bg-white text-primary-600 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium min-h-[44px] sm:min-h-0"
                        aria-label="Предыдущий вопрос"
                      >
                        ← Предыдущий
                      </button>
                      <button
                        onClick={nextQuestion}
                        disabled={idx === test.questions.length - 1}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary-300 bg-white text-primary-600 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium min-h-[44px] sm:min-h-0"
                        aria-label="Следующий вопрос"
                      >
                        Следующий →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 sm:mt-8 pt-6 border-t border-zinc-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <button
                disabled={!allAnswered || submitting || submitted}
                onClick={() => setShowConfirmModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg gradient-primary px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all min-h-[44px] sm:min-h-0"
              >
                {submitting ? "Отправляем..." : submitted ? "Тест отправлен" : "Завершить тест"}
                {!submitting && !submitted && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
              </button>

              {!allAnswered && (
                <div className="text-sm text-zinc-500">
                  Ответьте на все вопросы, чтобы отправить результат
                </div>
              )}
            </div>

            {/* Модальное окно подтверждения */}
            {showConfirmModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
                <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-md w-full mx-4 shadow-2xl animate-scale-in relative max-h-[90vh] overflow-y-auto">
                  <h3 className="text-lg sm:text-xl font-bold mb-4">Подтверждение отправки</h3>
                  <p className="text-zinc-600 mb-4">
                    Вы ответили на {answeredCount} из {test.questions.length} вопросов. 
                    Вы уверены, что хотите завершить тест?
                  </p>
                  {!allAnswered && (
                    <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
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
                        if (submitted) {
                          addToast("Тест уже отправлен!", "error");
                          setShowConfirmModal(false);
                          return;
                        }
                        setShowConfirmModal(false);
                        setSubmitting(true);
                        setResult(null);
                        const endTime = new Date().toISOString();
                        try {
                          const res = await fetch("/api/submit", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              // userId больше не передается, берется из JWT токена для безопасности
                              testId: test.id,
                              answers,
                              startTime,
                              endTime,
                            }),
                          });
                          const json = (await res.json()) as SubmitResponse;
                          setResult(json);
                          setSubmitted(true);
                          if (json.ok) {
                            // Проверяем все ответы и показываем справки после отправки
                            const checkAllAnswers = async () => {
                              const hints: Record<string, boolean> = {};
                              const results: Record<string, boolean> = {};
                              
                              for (const question of test.questions) {
                                const userAnswer = answers[question.id];
                                if (userAnswer !== null && userAnswer !== undefined) {
                                  const correct = await checkAnswerLocally(question.id, userAnswer);
                                  hints[question.id] = true;
                                  results[question.id] = correct;
                                }
                              }
                              
                              setAnsweredHints(hints);
                              setHintResults(results);
                            };
                            
                            await checkAllAnswers();
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
                      className="flex-1 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-600 hover:opacity-90 transition-all"
                    >
                      Да, завершить
                    </button>
                    <button
                      onClick={() => setShowConfirmModal(false)}
                      className="flex-1 rounded-lg border px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-primary-100 transition-colors"
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
                      <Award className="h-5 w-5 sm:h-6 sm:w-6 text-success" aria-hidden="true" />
                      <div className="font-bold text-base sm:text-lg text-zinc-900">Результат отправлен ✅</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
                      <NavigateToLeaderboard />
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
