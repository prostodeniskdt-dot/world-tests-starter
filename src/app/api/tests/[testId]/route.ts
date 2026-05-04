import { NextResponse } from "next/server";
import { getPublicTest } from "@/lib/tests-registry";
import { requireAuth } from "@/lib/auth-middleware";

export async function GET(
  req: Request,
  { params }: { params: { testId: string } }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const { testId } = params;
  const test = await getPublicTest(testId, {
    userId: authResult.userId,
    isAdmin: authResult.payload.isAdmin,
  });

  if (!test) {
    return NextResponse.json(
      { ok: false, error: "Тест не найден" },
      { status: 404 }
    );
  }

  // Возвращаем полный тест (вопросы + варианты, но без правильных ответов)
  return NextResponse.json({ ok: true, test });
}
