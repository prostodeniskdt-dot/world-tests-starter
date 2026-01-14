import { NextResponse } from "next/server";
import { SECRET_TESTS_MAP, PUBLIC_TESTS_MAP } from "@/lib/tests-registry";

// Функция для нормализации текстовых ответов
function normalizeTextAnswer(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Множественные пробелы -> один
    .replace(/[.,;:!?]/g, '') // Убрать пунктуацию
    .replace(/мл/g, ' мл')
    .replace(/%/g, ' процентов')
    .replace(/,/g, '.') // Заменить запятую на точку для чисел
    .replace(/≈/g, '') // Убрать знак приблизительно
    .trim();
}

// Функция для проверки текстовых ответов
function checkTextAnswer(userAnswer: string, correctAnswers: string | string[]): boolean {
  const normalized = normalizeTextAnswer(userAnswer);
  const correct = Array.isArray(correctAnswers) ? correctAnswers : [correctAnswers];
  
  return correct.some(correct => {
    const normalizedCorrect = normalizeTextAnswer(correct);
    // Точное совпадение после нормализации
    if (normalized === normalizedCorrect) {
      return true;
    }
    // Частичное совпадение (содержит ключевые слова)
    const userWords = normalized.split(' ').filter(w => w.length > 2);
    const correctWords = normalizedCorrect.split(' ').filter(w => w.length > 2);
    const matchCount = userWords.filter(w => correctWords.includes(w)).length;
    // Если совпадает больше половины ключевых слов
    if (correctWords.length > 0 && matchCount >= Math.ceil(correctWords.length * 0.5)) {
      return true;
    }
    return false;
  });
}

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

  const { questionId, answer } = body as { questionId?: string; answer?: number | string };
  
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
  
  const question = testPublic.questions.find(q => q.id === questionId);
  if (!question) {
    return NextResponse.json(
      { ok: false, error: "Вопрос не найден" },
      { status: 404 }
    );
  }
  
  let correct = false;
  if (question.type === "text") {
    const correctAnswers = (testSecret as any).textAnswers?.[questionId];
    if (typeof answer === "string" && correctAnswers) {
      correct = checkTextAnswer(answer, correctAnswers);
    }
  } else {
    const correctAnswer = testSecret.answerKey[questionId];
    if (typeof answer === "number") {
      correct = answer === correctAnswer;
    }
  }
  
  return NextResponse.json({ ok: true, correct });
}
