import { NextResponse } from "next/server";
import { submitSchema } from "@/lib/validators";
import { db } from "@/lib/db";
import { checkRateLimit, submitRateLimiter } from "@/lib/rateLimit";
import { getPublicTest, getSecretTest } from "@/lib/tests-registry";
import type { PublicTestQuestion } from "@/tests/types";
import { requireAuth } from "@/lib/auth-middleware";
import { checkAnswer } from "@/lib/answer-checkers";

export async function POST(req: Request) {
  // Получаем IP адрес
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";

  // Проверяем rate limit
  const rateLimit = await checkRateLimit(submitRateLimiter, ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: `Слишком много запросов. Попробуйте через ${Math.ceil(
          (rateLimit.resetTime?.getTime() || Date.now() - Date.now()) / 1000
        )} секунд.`,
      },
      { status: 429 }
    );
  }

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

  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем авторизацию ПЕРЕД использованием данных
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse || !authResult.ok) {
    return authResult;
  }

  const { userId } = authResult;
  const { testId, answers } = parsed.data;

  // Дополнительная проверка в БД (на случай если бан был установлен после создания токена)
  const { rows: userRows } = await db.query(
    `SELECT is_banned FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );

  if (userRows[0]?.is_banned) {
    return NextResponse.json(
      { ok: false, error: "Ваш аккаунт заблокирован. Вы не можете проходить тесты." },
      { status: 403 }
    );
  }

  // Получаем тест из БД
  const [testPublic, testSecret] = await Promise.all([
    getPublicTest(testId),
    getSecretTest(testId),
  ]);

  if (!testSecret || !testPublic) {
    return NextResponse.json(
      { ok: false, error: "Тест не найден" },
      { status: 404 }
    );
  }

  // Проверка на слишком частые попытки
  const { rows: recentAttempts } = await db.query(
    `SELECT created_at FROM attempts WHERE user_id = $1 AND test_id = $2 ORDER BY created_at DESC LIMIT 1`,
    [userId, testId]
  );

  if (recentAttempts.length > 0) {
    const lastAttempt = new Date(recentAttempts[0].created_at);
    const timeSinceLastAttempt = Date.now() - lastAttempt.getTime();
    
    // Минимум 10 секунд между попытками
    if (timeSinceLastAttempt < 10000) {
      return NextResponse.json(
        {
          ok: false,
          error: "Слишком частые попытки. Подождите немного.",
        },
        { status: 429 }
      );
    }
  }

  // Получаем ID всех вопросов из теста
  const questionIds = testPublic.questions.map((q: PublicTestQuestion) => q.id);

  // Проверка что ответы на все вопросы есть
  for (const qId of questionIds) {
    const v = answers[qId];
    if (v === null || v === undefined) {
      return NextResponse.json(
        { ok: false, error: "Ответь на все вопросы" },
        { status: 400 }
      );
    }
  }

  // Проверяем ответы
  const totalQuestions = questionIds.length;
  let correctCount = 0;
  for (const qId of questionIds) {
    const question = testPublic.questions.find((q: PublicTestQuestion) => q.id === qId);
    const userAnswer = answers[qId];
    
    if (!question) continue;
    
    const correctAnswer = testSecret.answerKey[qId];
    if (checkAnswer(question, userAnswer, correctAnswer)) {
      correctCount += 1;
    }
  }

  const scorePercent =
    totalQuestions === 0
      ? 0
      : Math.round((correctCount / totalQuestions) * 100);

  // Комбинированная формула очков
  const basePoints = testSecret.basePoints || 200;
  
  const difficultyMultiplier = {
    1: 1.0,
    2: 1.25,
    3: 1.5,
  }[testPublic.difficultyLevel] || 1.0;
  
  const percentageBonus = 
    scorePercent === 100 ? 1.3 :
    scorePercent >= 90 ? 1.15 :
    scorePercent >= 80 ? 1.05 :
    1.0;
  
  const pointsAwarded = Math.round(
    (basePoints * scorePercent / 100) * difficultyMultiplier * percentageBonus
  );

  // Проверяем лимит попыток
  if (testSecret.maxAttempts !== null && testSecret.maxAttempts !== undefined) {
    const { rows: userAttempts } = await db.query(
      `SELECT id FROM attempts WHERE user_id = $1 AND test_id = $2`,
      [userId, testId]
    );

    if (userAttempts.length >= testSecret.maxAttempts) {
      return NextResponse.json(
        {
          ok: false,
          error: `Достигнут лимит попыток (${testSecret.maxAttempts}).`,
        },
        { status: 403 }
      );
    }
  }

  // Проверяем, что пользователь существует
  const { rows: userExistsRows } = await db.query(
    `SELECT id FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );

  if (userExistsRows.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "Пользователь не найден. Пожалуйста, зарегистрируйтесь.",
      },
      { status: 404 }
    );
  }

  // Записываем в БД
  try {
    const { rows: data } = await db.query(
      `SELECT * FROM record_attempt($1, $2, $3, $4)`,
      [userId, testId, scorePercent, pointsAwarded]
    );

    const row = data[0];

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
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Ошибка базы данных. " + (err.message || String(err)),
      },
      { status: 500 }
    );
  }
}
