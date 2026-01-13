import { NextResponse } from "next/server";
import { PUBLIC_TESTS_MAP } from "@/lib/tests-registry";

export async function GET(
  req: Request,
  { params }: { params: { testId: string } }
) {
  const { testId } = params;
  const test = PUBLIC_TESTS_MAP[testId];

  if (!test) {
    return NextResponse.json(
      { ok: false, error: "Тест не найден" },
      { status: 404 }
    );
  }

  // Возвращаем полный тест (вопросы + варианты, но без правильных ответов)
  return NextResponse.json({ ok: true, test });
}
