import { NextResponse } from "next/server";
import { getSecretTest, getPublicTest } from "@/lib/tests-registry";
import type { PublicTestQuestion } from "@/tests/types";
import { checkAnswer } from "@/lib/answer-checkers";
import type { QuestionAnswer } from "@/tests/types";

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

  const { questionId, answer } = body as { questionId?: string; answer?: QuestionAnswer };
  
  if (!questionId || answer === undefined || answer === null) {
    return NextResponse.json(
      { ok: false, error: "Не указаны questionId или answer" },
      { status: 400 }
    );
  }
  
  const [testSecret, testPublic] = await Promise.all([
    getSecretTest(testId),
    getPublicTest(testId),
  ]);
  
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
  
  // Используем checkAnswer для поддержки всех механик
  const correctAnswer = testSecret.answerKey[questionId];
  const correct = checkAnswer(question, answer, correctAnswer);
  
  return NextResponse.json({ ok: true, correct });
}
