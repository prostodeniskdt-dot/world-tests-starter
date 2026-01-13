import { NextResponse } from "next/server";
import { PUBLIC_TESTS } from "@/lib/tests-registry";

export async function GET() {
  // Возвращаем только метаданные тестов (без вопросов)
  const tests = PUBLIC_TESTS.map((test) => ({
    id: test.id,
    title: test.title,
    description: test.description,
  }));

  return NextResponse.json({ ok: true, tests });
}
