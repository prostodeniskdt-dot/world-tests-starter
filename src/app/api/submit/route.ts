import { NextResponse } from "next/server";
import { submitSchema } from "@/lib/validators";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit, submitRateLimiter } from "@/lib/rateLimit";
import { PUBLIC_TESTS_MAP, SECRET_TESTS_MAP } from "@/lib/tests-registry";
import { requireAuth } from "@/lib/auth-middleware";

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
  const { testId, answers, startTime, endTime } = parsed.data;

  // Дополнительная проверка в БД (на случай если бан был установлен после создания токена)
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("is_banned")
    .eq("id", userId)
    .single();

  if (user?.is_banned) {
    return NextResponse.json(
      { ok: false, error: "Ваш аккаунт заблокирован. Вы не можете проходить тесты." },
      { status: 403 }
    );
  }

  // Получаем тест из файлов
  const testSecret = SECRET_TESTS_MAP[testId];
  const testPublic = PUBLIC_TESTS_MAP[testId];

  if (!testSecret || !testPublic) {
    return NextResponse.json(
      { ok: false, error: "Тест не найден" },
      { status: 404 }
    );
  }

  // Проверка на слишком частые попытки
  const { data: recentAttempts } = await supabaseAdmin
    .from("attempts")
    .select("created_at")
    .eq("user_id", userId)
    .eq("test_id", testId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (recentAttempts && recentAttempts.length > 0) {
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
  const questionIds = testPublic.questions.map((q) => q.id);

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

  // Проверяем ответы используя answerKey из файла
  const totalQuestions = questionIds.length;
  let correctCount = 0;
  for (const qId of questionIds) {
    const question = testPublic.questions.find(q => q.id === qId);
    const userAnswer = answers[qId];
    
    if (!question) continue;
    
    // Все вопросы теперь только с вариантами
    const correctAnswer = testSecret.answerKey[qId];
    if (typeof userAnswer === "number" && userAnswer === correctAnswer) {
      correctCount += 1;
    }
  }

  const scorePercent =
    totalQuestions === 0
      ? 0
      : Math.round((correctCount / totalQuestions) * 100);

  // Формула очков: каждый правильный ответ = 10 очков
  const pointsAwarded = correctCount * 10;

  // Проверяем лимит попыток (если указан в тесте)
  if (testSecret.maxAttempts !== null && testSecret.maxAttempts !== undefined) {
    const { data: userAttempts, error: attemptsError } = await supabaseAdmin
      .from("attempts")
      .select("id")
      .eq("user_id", userId)
      .eq("test_id", testId);

    if (attemptsError) {
      return NextResponse.json(
        { ok: false, error: "Ошибка проверки попыток" },
        { status: 500 }
      );
    }

    const attemptsCount = (userAttempts || []).length;
    if (attemptsCount >= testSecret.maxAttempts) {
      return NextResponse.json(
        {
          ok: false,
          error: `Достигнут лимит попыток (${testSecret.maxAttempts}). Вы уже проходили этот тест максимальное количество раз.`,
        },
        { status: 403 }
      );
    }
  }

  // Проверяем, что пользователь существует
  const { data: userExists } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();

  if (!userExists) {
    return NextResponse.json(
      {
        ok: false,
        error: "Пользователь не найден. Пожалуйста, зарегистрируйтесь.",
      },
      { status: 404 }
    );
  }

  // Записываем в БД через RPC (атомарно обновляет user_stats)
  const { data, error } = await supabaseAdmin.rpc("record_attempt", {
    p_user_id: userId,
    p_test_id: testId,
    p_score_percent: scorePercent,
    p_points_awarded: pointsAwarded,
  });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Ошибка базы данных. " + error.message,
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
