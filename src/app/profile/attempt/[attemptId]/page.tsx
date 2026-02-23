import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { getTestWithQuestionsById } from "@/lib/tests-registry";
import type { PublicTestQuestion } from "@/tests/types";
import { Check, X, ArrowLeft } from "lucide-react";

type AttemptAnswer = {
  question_id: string;
  user_answer: unknown;
  is_correct: boolean;
};

function formatUserAnswer(question: PublicTestQuestion, userAnswer: unknown): string {
  if (userAnswer === null || userAnswer === undefined) return "—";
  if (typeof userAnswer === "number") {
    const q = question as { options?: string[] };
    return q.options?.[userAnswer] ?? `Вариант ${userAnswer + 1}`;
  }
  if (Array.isArray(userAnswer)) {
    const q = question as { options?: string[] };
    return userAnswer.map((i) => q.options?.[i] ?? i).join(", ") || "—";
  }
  if (typeof userAnswer === "object" && userAnswer !== null) {
    const o = userAnswer as Record<string, unknown>;
    if ("answer" in o && "reason" in o) {
      const q = question as { reasons?: string[] };
      const ans = o.answer ? "Верно" : "Неверно";
      const reasonIdx = typeof o.reason === "number" ? o.reason : -1;
      const reason = q.reasons?.[reasonIdx] ?? "";
      return `${ans}${reason ? ` (${reason})` : ""}`;
    }
    if ("step1" in o && "step2" in o) {
      const q = question as { step1?: { options?: string[] }; step2?: { options?: string[] } };
      const s1 = q.step1?.options?.[o.step1 as number] ?? o.step1;
      const s2 = q.step2?.options?.[o.step2 as number] ?? o.step2;
      return `${s1} → ${s2}`;
    }
    if ("blocks" in o && "order" in o) {
      return `[блоки и порядок]`;
    }
    return JSON.stringify(userAnswer);
  }
  return String(userAnswer);
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

  const test = await getTestWithQuestionsById(attempt.test_id);
  if (!test) notFound();

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
                      Вопрос {idx + 1}: {q.text}
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
