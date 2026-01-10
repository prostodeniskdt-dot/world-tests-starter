import { NextResponse } from "next/server";
import { submitSchema } from "@/lib/validators";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { TEST_1_PUBLIC } from "@/tests/test-1.public";
import { TEST_1_SECRET } from "@/tests/test-1.answer";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Невалидный JSON" },
      { status: 400 }
    );
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const { userId, username, testId, answers } = parsed.data;

  // Для стартера есть только один тест
  if (TEST_1_PUBLIC.id !== TEST_1_SECRET.id) {
    return NextResponse.json(
      { ok: false, error: "Конфиг теста сломан: id public/secret не совпадают" },
      { status: 500 }
    );
  }

  if (testId !== TEST_1_PUBLIC.id) {
    return NextResponse.json(
      { ok: false, error: "Неизвестный testId" },
      { status: 400 }
    );
  }

// Проверка что ответы на все вопросы есть
  for (const q of TEST_1_PUBLIC.questions) {
    const v = answers[q.id];
    if (typeof v !== "number") {
      return NextResponse.json(
        { ok: false, error: "Ответь на все вопросы" },
        { status: 400 }
      );
    }
    if (v < 0 || v >= q.options.length) {
      return NextResponse.json(
        { ok: false, error: "Невалидный вариант ответа" },
        { status: 400 }
      );
    }
  }

  const totalQuestions = TEST_1_PUBLIC.questions.length;
  let correctCount = 0;

  for (const q of TEST_1_PUBLIC.questions) {
    const correctIdx = TEST_1_SECRET.answerKey[q.id];
    const userIdx = answers[q.id] as number;
    if (userIdx === correctIdx) correctCount += 1;
  }

  const scorePercent =
    totalQuestions === 0
      ? 0
      : Math.round((correctCount / totalQuestions) * 100);

  // Формула очков (MVP):
  // basePoints * difficulty * (correct/total)
  const rawPoints =
    TEST_1_SECRET.basePoints *
    TEST_1_SECRET.difficulty *
    (totalQuestions === 0 ? 0 : correctCount / totalQuestions);

  const pointsAwarded = Math.max(0, Math.round(rawPoints));

  // Записываем в БД через RPC (атомарно обновляет user_stats)
  const { data, error } = await supabaseAdmin.rpc("record_attempt", {
    p_user_id: userId,
    p_username: username,
    p_test_id: testId,
    p_score_percent: scorePercent,
    p_points_awarded: pointsAwarded,
  });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Ошибка базы данных. Убедись, что выполнил supabase/schema.sql. " +
          error.message,
      },
      { status: 500 }
    );
  }

  const row = Array.isArray(data) ? data[0] : data;

  return NextResponse.json({
    ok: true,
    result: {
      testId,
      correctCount,
      totalQuestions,
      scorePercent,
      pointsAwarded,
      totalPoints: row?.total_points ?? pointsAwarded,
      testsCompleted: row?.tests_completed ?? 1,
    },
  });
}
