import { NextResponse } from "next/server";
import { SECRET_TESTS_MAP, PUBLIC_TESTS_MAP, type PublicTestQuestion } from "@/lib/tests-registry";

export async function POST(
  req: Request,
  { params }: { params: { testId: string } }
) {
  const { testId } = params;
  
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Невалидный JSON" },
      { status: 400 }
    );
  }

  const { questionId, answer } = body as { questionId?: string; answer?: number };
  
  if (!questionId || answer === undefined || answer === null) {
    return NextResponse.json(
      { ok: false, error: "Не указаны questionId или answer" },
      { status: 400 }
    );
  }
  
  const testSecret = SECRET_TESTS_MAP[testId];
  const testPublic = PUBLIC_TESTS_MAP[testId];
  
  if (!testSecret || !testPublic) {
    return NextResponse.json(
      { ok: false, error: "Тест не найден" },
      { status: 404 }
    );
  }
  
  const question = testPublic.questions.find((q: PublicTestQuestion) => q.id === questionId);
  if (!question) {
    return NextResponse.json(
      { ok: false, error: "Вопрос не найден" },
      { status: 404 }
    );
  }
  
  // Все вопросы теперь только с вариантами
  const correctAnswer = testSecret.answerKey[questionId];
  const correct = typeof answer === "number" && answer === correctAnswer;
  
  return NextResponse.json({ ok: true, correct });
}
