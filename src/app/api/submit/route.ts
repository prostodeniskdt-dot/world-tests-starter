import { NextResponse } from "next/server";
import { submitSchema } from "@/lib/validators";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit, submitRateLimiter } from "@/lib/rateLimit";

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

  const { userId, testId, answers, startTime, endTime } = parsed.data;

  // Получаем тест для проверки времени
  const { data: test, error: testError } = await supabaseAdmin
    .from("tests")
    .select("*")
    .eq("id", testId)
    .single();

  if (testError || !test) {
    return NextResponse.json(
      { ok: false, error: "Тест не найден" },
      { status: 404 }
    );
  }

  // Проверка времени прохождения
  if (startTime && endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationSeconds = (end.getTime() - start.getTime()) / 1000;
    
    // Получаем количество вопросов
    const { data: questions } = await supabaseAdmin
      .from("test_questions")
      .select("id")
      .eq("test_id", testId);
    
    // Минимальное время прохождения (30 секунд на вопрос)
    const minDuration = ((questions || []).length || 1) * 30;
    if (durationSeconds < minDuration) {
      return NextResponse.json(
        {
          ok: false,
          error: "Подозрительно быстрое прохождение теста. Попробуйте еще раз.",
        },
        { status: 400 }
      );
    }
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


  // Получаем вопросы
  const { data: questions, error: questionsError } = await supabaseAdmin
    .from("test_questions")
    .select("id")
    .eq("test_id", testId);

  if (questionsError) {
    return NextResponse.json(
      { ok: false, error: "Ошибка получения вопросов" },
      { status: 500 }
    );
  }

  const questionIds = (questions || []).map((q) => q.id);

  // Проверка что ответы на все вопросы есть
  for (const qId of questionIds) {
    const v = answers[qId];
    if (typeof v !== "number") {
      return NextResponse.json(
        { ok: false, error: "Ответь на все вопросы" },
        { status: 400 }
      );
    }
  }

  // Получаем правильные ответы
  const { data: options } = await supabaseAdmin
    .from("test_options")
    .select("id, question_id, option_order, is_correct")
    .in("question_id", questionIds);

  // Создаем мапу правильных ответов
  const correctAnswers: Record<string, number> = {};
  (questions || []).forEach((q) => {
    const correctOption = (options || []).find(
      (opt) => opt.question_id === q.id && opt.is_correct
    );
    if (correctOption) {
      correctAnswers[q.id] = correctOption.option_order;
    }
  });

  // Проверяем ответы
  const totalQuestions = questionIds.length;
  let correctCount = 0;
  for (const qId of questionIds) {
    const userAnswer = answers[qId];
    const correctAnswer = correctAnswers[qId];
    if (userAnswer === correctAnswer) {
      correctCount += 1;
    }
  }

  const scorePercent =
    totalQuestions === 0
      ? 0
      : Math.round((correctCount / totalQuestions) * 100);

  // Формула очков (MVP):
  // basePoints * difficulty * (correct/total)
  const rawPoints =
    test.base_points *
    test.difficulty *
    (totalQuestions === 0 ? 0 : correctCount / totalQuestions);

  const pointsAwarded = Math.max(0, Math.round(rawPoints));

  // Проверяем лимит попыток
  if (test.max_attempts !== null) {
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
    if (attemptsCount >= test.max_attempts) {
      return NextResponse.json(
        {
          ok: false,
          error: `Достигнут лимит попыток (${test.max_attempts}). Вы уже проходили этот тест максимальное количество раз.`,
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
