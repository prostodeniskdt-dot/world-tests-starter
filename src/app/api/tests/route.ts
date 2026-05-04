import { NextResponse } from "next/server";
import { getPublicTests, getCategories } from "@/lib/tests-registry";
import { getAuthContextOptional } from "@/lib/auth-middleware";

export async function GET() {
  try {
    const auth = await getAuthContextOptional();
    const ctx = {
      userId: auth?.userId ?? null,
      isAdmin: auth?.isAdmin ?? false,
    };
    const [allTests, categories] = await Promise.all([
      getPublicTests(ctx),
      getCategories(ctx),
    ]);

    // Возвращаем только метаданные тестов (без вопросов)
    const tests = allTests.map((test) => ({
      id: test.id,
      title: test.title,
      description: test.description,
      category: test.category,
      author: test.author,
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
