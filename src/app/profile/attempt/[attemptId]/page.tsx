import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { getTestWithQuestionsById, getTestById, canViewTestQuestionBreakdownInProfile } from "@/lib/tests-registry";
import type { PublicTestQuestion } from "@/tests/types";
import { Check, X, ArrowLeft } from "lucide-react";

type AttemptAnswer = {
  question_id: string;
  user_answer: unknown;
  is_correct: boolean;
};

function formatUserAnswer(question: PublicTestQuestion, userAnswer: unknown): string {
  if (userAnswer === null || userAnswer === undefined) return "—";

  switch (question.type) {
    case "multiple-choice":
    case "best-example":
      return typeof userAnswer === "number"
        ? question.options[userAnswer] ?? `Вариант ${userAnswer + 1}`
        : "—";

    case "multiple-select":
      return Array.isArray(userAnswer)
        ? userAnswer.map((index) => question.options[index] ?? `Вариант ${index + 1}`).join(", ")
        : "—";

    case "true-false-enhanced": {
      const value = userAnswer as { answer?: boolean; reason?: number };
      const answerText = value.answer === true ? "Верно" : value.answer === false ? "Неверно" : "—";
      const reason =
        typeof value.reason === "number" ? question.reasons[value.reason] : undefined;
      return `${answerText}${reason ? ` — ${reason}` : ""}`;
    }

    case "cloze-dropdown":
      return Array.isArray(userAnswer)
        ? userAnswer
            .map((optionIndex, gapIndex) => {
              const gapOptions = question.gaps[gapIndex]?.options ?? [];
              const options = [
                ...gapOptions,
                ...(question.extraOptions ?? []).filter(
                  (option) => !gapOptions.includes(option)
                ),
              ];
              return options[optionIndex] ?? `Вариант ${optionIndex + 1}`;
            })
            .join(" · ")
        : "—";

    case "select-errors":
      return Array.isArray(userAnswer)
        ? userAnswer
            .map(
              (partId) =>
                question.markedParts.find((part) => part.id === partId)?.text ??
                `Фрагмент ${partId}`
            )
            .join(", ")
        : "—";

    case "matching":
      return Array.isArray(userAnswer)
        ? (userAnswer as [number, number][])
            .map(
              ([left, right]) =>
                `${question.leftItems[left] ?? left} → ${question.rightItems[right] ?? right}`
            )
            .join("; ")
        : "—";

    case "ordering":
      return Array.isArray(userAnswer)
        ? userAnswer.map((itemIndex) => question.items[itemIndex] ?? itemIndex).join(" → ")
        : "—";

    case "two-step": {
      const value = userAnswer as { step1?: number; step2?: number };
      const step1 =
        typeof value.step1 === "number"
          ? question.step1.options[value.step1] ?? value.step1
          : "—";
      const step2 =
        typeof value.step2 === "number"
          ? question.step2.options[value.step2] ?? value.step2
          : "—";
      return `${step1} → ${step2}`;
    }

    case "matrix": {
      if (typeof userAnswer !== "object" || userAnswer === null || Array.isArray(userAnswer)) {
        return "—";
      }
      const values = userAnswer as Record<string, number | number[]>;
      return question.rows
        .map((row, rowIndex) => {
          const selected = values[String(rowIndex)];
          const columns = Array.isArray(selected)
            ? selected.map((column) => question.columns[column] ?? column).join(", ")
            : question.columns[selected] ?? selected;
          return `${row}: ${columns ?? "—"}`;
        })
        .join("; ");
    }

    default:
      return String(userAnswer);
  }
}

function formatQuestionPrompt(question: PublicTestQuestion): string {
  switch (question.type) {
    case "true-false-enhanced": {
      const statement = question.statement.trim();
      return !statement || statement.toLocaleLowerCase("ru-RU") === "верно или неверно?"
        ? question.text.replace(/^\s*утверждение\s*:\s*/i, "")
        : statement;
    }
    case "select-errors":
      return question.content;
    case "two-step":
      return [question.step1.question, question.step2.question].filter(Boolean).join(" / ");
    default:
      return question.text;
  }
}

export default async function AttemptDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<{ userId?: string }>;
}) {
  const { attemptId } = await params;
  const { userId: requestedUserId } = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const currentUser = token ? verifyToken(token) : null;

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-zinc-600">Войдите, чтобы просмотреть детали попытки.</p>
      </div>
    );
  }

  const { rows: attemptRows } = await db.query(
    `SELECT a.id, a.user_id, a.test_id, a.score_percent, a.points_awarded, a.created_at
     FROM attempts a
     INNER JOIN tests t ON t.id = a.test_id
     WHERE a.id = $1`,
    [attemptId]
  );
  const attempt = attemptRows[0];
  if (!attempt) notFound();

  const attemptUserId = attempt.user_id as string;
  const isOwner = attemptUserId === currentUser.userId;
  const isViewingOtherProfile = requestedUserId && requestedUserId === attemptUserId;

  let canView = isOwner;
  if (!canView && isViewingOtherProfile) {
    const { rows: userRows } = await db.query(
      `SELECT consent_public_rating FROM users WHERE id = $1`,
      [attemptUserId]
    );
    canView = Boolean(userRows[0]?.consent_public_rating);
  }
  if (!canView) notFound();

  const { rows: answerRows } = await db.query(
    `SELECT question_id, user_answer, is_correct FROM attempt_answers WHERE attempt_id = $1 ORDER BY question_id`,
    [attemptId]
  );
  const answersMap = new Map<string, AttemptAnswer>();
  for (const r of answerRows || []) {
    answersMap.set(r.question_id, {
      question_id: r.question_id,
      user_answer: r.user_answer,
      is_correct: r.is_correct,
    });
  }

  const canSeeBreakdown = await canViewTestQuestionBreakdownInProfile(
    attempt.test_id,
    currentUser.userId,
    attemptUserId,
    currentUser.isAdmin
  );
  const testFull = canSeeBreakdown ? await getTestWithQuestionsById(attempt.test_id) : null;
  const testMeta = canSeeBreakdown ? testFull : await getTestById(attempt.test_id);
  if (!testMeta) notFound();
  const test = testFull ?? {
    id: testMeta.id,
    title: testMeta.title,
    description: null as string | null,
    category: testMeta.category,
    difficultyLevel: 1 as 1 | 2 | 3,
    author: undefined as string | undefined,
    questions: [] as PublicTestQuestion[],
  };

  const backUrl = requestedUserId
    ? `/profile?userId=${requestedUserId}`
    : "/profile";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <Link
        href={backUrl}
        className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад в профиль
      </Link>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-2">
          {test.title}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-zinc-600 mb-6">
          <span>
            {new Date(attempt.created_at).toLocaleDateString("ru-RU", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="font-semibold text-primary-600">
            Результат: {attempt.score_percent}%
          </span>
          <span className="font-semibold text-success">
            +{attempt.points_awarded} очков
          </span>
        </div>

        {answerRows.length === 0 ? (
          <p className="text-sm text-zinc-500 italic">
            Детали ответов по этой попытке не сохранялись (попытка до обновления системы).
          </p>
        ) : !canSeeBreakdown ? (
          <p className="text-sm text-zinc-600 border border-zinc-200 rounded-lg p-4 bg-zinc-50">
            Формулировки вопросов по этому тесту скрыты (закрытый тест). Доступны только итог:{" "}
            <span className="font-semibold">{attempt.score_percent}%</span> и начисленные очки.
          </p>
        ) : (
        <div className="space-y-4">
          {test.questions.map((q, idx) => {
            const ans = answersMap.get(q.id);
            const isCorrect = ans?.is_correct ?? false;
            const userAnswerStr = ans
              ? formatUserAnswer(q, ans.user_answer)
              : "—";

            return (
              <div
                key={q.id}
                className={`rounded-lg border p-4 ${
                  isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isCorrect ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                    }`}
                  >
                    {isCorrect ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <X className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-zinc-900 mb-1">
                      Вопрос {idx + 1}: {formatQuestionPrompt(q)}
                    </div>
                    <div className="text-sm text-zinc-600">
                      Ваш ответ: {userAnswerStr}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}
