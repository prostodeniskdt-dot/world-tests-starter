import { NextResponse } from "next/server";
import { getPublicTests, getCategories } from "@/lib/tests-registry";

export async function GET() {
  try {
    const [allTests, categories] = await Promise.all([
      getPublicTests(),
      getCategories(),
    ]);

    // Возвращаем только метаданные тестов (без вопросов)
    const tests = allTests.map((test) => ({
      id: test.id,
      title: test.title,
      description: test.description,
      category: test.category,
      difficultyLevel: test.difficultyLevel,
    }));

    return NextResponse.json({ ok: true, tests, categories });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Ошибка загрузки тестов" },
      { status: 500 }
    );
  }
}
