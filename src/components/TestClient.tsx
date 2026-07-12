"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { UserGate, useLocalUser } from "@/components/UserGate";
import { ArrowRight, Award, Send } from "lucide-react";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { addToast } from "./Toast";
import { NavigateToLeaderboard } from "./NavigateToLeaderboard";
import { QuestionRenderer } from "./questions/QuestionRenderer";
import type { PublicTest } from "@/lib/tests-registry";
import type { QuestionAnswer } from "@/tests/types";
import {
  allQuestionsAnswered,
  countAnsweredQuestions,
  isAnswerComplete,
  saveTestDraft,
  loadTestDraft,
  clearTestDraft,
} from "@/lib/question-answer-utils";

const AUTHOR_TELEGRAM_URL = "https://t.me/TomSemm";
const DRAFT_VERSION = 1;

function normalizePromptText(value: string): string {
  return value
    .replace(/^\s*утверждение\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("ru-RU");
}

function SubscribeAuthorButton() {
  return (
    <a
      href={AUTHOR_TELEGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 hover:border-primary-300 transition-colors"
    >
      <Send className="h-4 w-4" aria-hidden />
      Подписаться на тг автора
    </a>
  );
}

type SubmitResponse =
  | {
      ok: true;
      result: {
        testId: string;
        correctCount: number;
        totalQuestions: number;
        scorePercent: number;
        pointsAwarded: number;
        pointsEarned: number;
        totalPoints: number;
        testsCompleted: number;
        questionResults?: Record<string, boolean>;
      };
    }
  | { ok: false; error: string };

export function TestClient({ test }: { test: PublicTest }) {
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer | null>>(() => {
    const init: Record<string, QuestionAnswer | null> = {};
    for (const q of test.questions) init[q.id] = null;
    const draft = loadTestDraft(test.id, DRAFT_VERSION);
    if (draft) {
      for (const q of test.questions) {
        if (draft[q.id] !== undefined) init[q.id] = draft[q.id];
      }
    }
    return init;
  });

  const [answeredHints, setAnsweredHints] = useState<Record<string, boolean>>({});
  const [hintResults, setHintResults] = useState<Record<string, boolean>>({});

  const allAnswered = useMemo(
    () => allQuestionsAnswered(test.questions, answers),
    [answers, test.questions]
  );

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [startTime] = useState(new Date().toISOString());
  const [attemptsInfo, setAttemptsInfo] = useState<{
    used: number;
    max: number | null;
  } | null>(null);
  const { user: currentUser } = useLocalUser();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const confirmModalRef = useRef<HTMLDivElement>(null);
  // Ключ идемпотентности: один на одно нажатие «Завершить тест», чтобы повторная отправка не создавала дубль попытки
  const [submitIdempotencyKey, setSubmitIdempotencyKey] = useState<string | null>(null);

  const answeredCount = useMemo(
    () => countAnsweredQuestions(test.questions, answers),
    [answers, test.questions]
  );

  useEffect(() => {
    if (submitted) return;
    saveTestDraft(test.id, DRAFT_VERSION, answers);
  }, [answers, submitted, test.id]);

  const progressPercent = (answeredCount / test.questions.length) * 100;

  // Результаты по вопросам приходят из submit — без отдельных check-answer запросов
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
      fetch(`/api/tests/${test.id}/attempts`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setAttemptsInfo(data);
          }
        })
        .catch(() => {});
    }
  }, [test.id, currentUser?.userId]);

  useEffect(() => {
    const siteHeader = document.querySelector<HTMLElement>("[data-site-header]");
    if (!siteHeader) return;

    const updateHeaderHeight = () => {
      document.documentElement.style.setProperty(
        "--site-header-height",
        `${siteHeader.getBoundingClientRect().height}px`
      );
    };
    updateHeaderHeight();

    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(siteHeader);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!showConfirmModal) return;
    const modal = confirmModalRef.current;
    const focusable = modal?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowConfirmModal(false);
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showConfirmModal]);

  // При открытии модалки подтверждения генерируем ключ идемпотентности для этой отправки
  const openConfirmModal = () => {
    setSubmitIdempotencyKey(crypto.randomUUID());
    setShowConfirmModal(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6 sm:space-y-8">
      <header className="animate-slide-up">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h1 className="font-display text-h1 text-stone-950">{test.title}</h1>
          <DifficultyBadge level={test.difficultyLevel} />
        </div>
        <p className="mt-1 text-sm text-stone-500">
          Автор: {test.author ?? "Денис Колодешников"}
        </p>
        {test.description && (
          <p className="mt-3 text-stone-600 text-body leading-relaxed">{test.description}</p>
        )}
        <div className="mt-4">
          <SubscribeAuthorButton />
        </div>
      </header>

      <div className="sticky top-[calc(var(--site-header-height,6.5rem)+0.5rem)] z-20 rounded-xl border border-stone-200/80 bg-surface-raised/95 backdrop-blur-md shadow-soft p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-stone-700">
            Прогресс: {answeredCount} / {test.questions.length} вопросов
          </span>
          <span className="font-mono text-sm font-semibold text-primary-700">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="gradient-primary h-full rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <UserGate title="Для прохождения теста необходима регистрация">
        {(user) => (
          <div className="surface-card p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-200">
              <div className="text-sm text-stone-600">
                Вы:{" "}
                <span className="font-semibold text-stone-900">
                  {user.firstName} {user.lastName}
                </span>
              </div>

              {attemptsInfo && attemptsInfo.max !== null && (
                <div className="font-mono text-sm text-stone-700 px-3 py-1 bg-primary-50 border border-primary-200 rounded-lg">
                  Попыток: {attemptsInfo.used} / {attemptsInfo.max}
                </div>
              )}
            </div>

            <div className="space-y-10">
              {test.questions.map((q, idx) => {
                const hasSingleTrueFalseExplanation =
                  q.type === "true-false-enhanced" &&
                  q.reasons.length === 1 &&
                  !!q.reasons[0];
                const showHint =
                  !!answeredHints[q.id] && (!!q.hint || hasSingleTrueFalseExplanation);
                const isCorrect = hintResults[q.id];
                const mechanicPrompt =
                  q.type === "true-false-enhanced"
                    ? !q.statement.trim() ||
                      q.statement.trim().toLocaleLowerCase("ru-RU") === "верно или неверно?"
                      ? q.text
                      : q.statement
                    : q.type === "select-errors"
                      ? q.content
                      : q.type === "cloze-dropdown"
                        ? q.text
                        : "";
                const rendersSamePrompt =
                  !!mechanicPrompt &&
                  normalizePromptText(q.text) === normalizePromptText(mechanicPrompt);

                return (
                  <div key={q.id} id={`question-${idx}`} className="pt-2 first:pt-0">
                    <div className="flex items-start gap-3 sm:gap-4 mb-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-900 text-primary-300 flex items-center justify-center font-mono font-bold text-sm">
                        {idx + 1}
                      </div>
                      {!!q.text.trim() && !rendersSamePrompt && (
                        <div className="font-sans text-base sm:text-lg font-semibold text-stone-950 leading-relaxed flex-1 min-w-0 break-words">
                          {q.text}
                        </div>
                      )}
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
                  </div>
                );
              })}
            </div>

            <div className="mt-6 sm:mt-8 pt-6 border-t border-zinc-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <button
                disabled={!allAnswered || submitting || submitted}
                onClick={openConfirmModal}
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
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
                onMouseDown={(event) => {
                  if (event.currentTarget === event.target) setShowConfirmModal(false);
                }}
              >
                <div
                  ref={confirmModalRef}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="submit-confirm-title"
                  className="bg-white rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl animate-scale-in relative max-h-[90vh] overflow-y-auto"
                >
                  <h3 id="submit-confirm-title" className="text-lg sm:text-xl font-bold mb-4">Подтверждение отправки</h3>
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
                          .filter(({ q }) => !isAnswerComplete(q, answers[q.id]))
                          .map(({ qIdx }) => qIdx + 1)
                          .join(", ")}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col-reverse sm:flex-row gap-3">
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
                            credentials: "include", // Важно: отправляем cookies для аутентификации
                            body: JSON.stringify({
                              testId: test.id,
                              answers,
                              startTime,
                              endTime,
                              idempotencyKey: submitIdempotencyKey ?? undefined,
                            }),
                          });

                          // Проверяем, что ответ получен
                          if (!res) {
                            throw new Error("Нет ответа от сервера");
                          }

                          // Пытаемся распарсить JSON, даже если статус не OK
                          let json: SubmitResponse;
                          try {
                            const text = await res.text();
                            if (!text) {
                              // Если пустой ответ, создаем ошибку на основе статуса
                              const statusCode = res.status || 0;
                              console.error("Пустой ответ от сервера, статус:", statusCode);
                              const errorMsg = 
                                statusCode === 401
                                  ? "Требуется авторизация. Пожалуйста, войдите в систему."
                                  : statusCode === 403
                                  ? "Доступ запрещен. Проверьте права доступа."
                                  : statusCode >= 500
                                  ? "Сервер временно недоступен. Попробуйте позже."
                                  : statusCode === 0
                                  ? "Сеть/сервер недоступны. Проверьте подключение к интернету."
                                  : `Ошибка сервера (${statusCode})`;
                              throw new Error(errorMsg);
                            }
                            json = JSON.parse(text) as SubmitResponse;
                            // Логируем ответ для отладки
                            if (!json.ok) {
                              console.error("Ошибка от сервера:", json.error, "Статус:", res.status);
                            }
                          } catch (parseError) {
                            // Если не удалось распарсить JSON, создаем ошибку на основе статуса
                            const statusText = res.statusText || "Неизвестная ошибка";
                            const statusCode = res.status || 0;
                            console.error("Ошибка парсинга ответа:", parseError, "Статус:", statusCode, "Статус текст:", statusText);
                            const errorMsg = 
                              statusCode === 401
                                ? "Требуется авторизация. Пожалуйста, войдите в систему."
                                : statusCode === 403
                                ? "Доступ запрещен. Проверьте права доступа."
                                : statusCode >= 500
                                ? "Сервер временно недоступен. Попробуйте позже."
                                : statusCode === 0
                                ? "Сеть/сервер недоступны. Проверьте подключение к интернету."
                                : parseError instanceof Error
                                ? parseError.message
                                : `Ошибка сервера (${statusCode}): ${statusText}`;
                            throw new Error(errorMsg);
                          }

                          setResult(json);
                          
                          if (json.ok) {
                            setSubmitted(true);
                            clearTestDraft(test.id);
                            try {
                              sessionStorage.setItem(`submitted_${test.id}`, Date.now().toString());
                            } catch {
                              // sessionStorage недоступен (private mode и т.п.)
                            }
                            const qr = json.result.questionResults ?? {};
                            const hints: Record<string, boolean> = {};
                            const results: Record<string, boolean> = {};
                            for (const question of test.questions) {
                              if (answers[question.id] !== null && answers[question.id] !== undefined) {
                                hints[question.id] = true;
                                results[question.id] = !!qr[question.id];
                              }
                            }
                            setAnsweredHints(hints);
                            setHintResults(results);
                            addToast("Тест успешно отправлен!", "success");
                          } else {
                            // Сервер вернул ошибку в формате JSON - показываем реальное сообщение
                            const errorMsg = json.error || "Ошибка отправки теста";
                            addToast(errorMsg, "error");
                          }
                        } catch (e) {
                          // Обработка сетевых ошибок и ошибок парсинга
                          const error = e instanceof Error ? e : new Error("Неизвестная ошибка");
                          const errorMsg = error.message || "Сеть/сервер недоступны. Попробуй ещё раз.";
                          setResult({
                            ok: false,
                            error: errorMsg,
                          });
                          addToast(errorMsg, "error");
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                      className="flex-1 min-h-11 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-all"
                    >
                      Да, завершить
                    </button>
                    <button
                      onClick={() => setShowConfirmModal(false)}
                      className="flex-1 min-h-11 rounded-lg border px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-primary-100 transition-colors"
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
                        <div className="text-zinc-600 mb-1">Начислено в рейтинг</div>
                        <div className="font-bold text-2xl text-primary-600">
                          +{result.result.pointsEarned}
                        </div>
                        {result.result.pointsEarned === 0 ? (
                          <div className="mt-1 text-xs text-stone-500 font-medium">
                            Личный рекорд не улучшен. Практиковаться можно без ограничений.
                          </div>
                        ) : result.result.scorePercent >= 80 && (
                          <div className="mt-1 text-xs text-primary-600 font-medium">
                            {result.result.scorePercent === 100 ? '🌟 Идеально! +30% бонус' : 
                             result.result.scorePercent >= 90 ? '⭐ Отлично! +15% бонус' : 
                             '✨ Хорошо! +5% бонус'}
                          </div>
                        )}
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
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <NavigateToLeaderboard />
                      <SubscribeAuthorButton />
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
