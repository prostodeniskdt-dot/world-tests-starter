import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";

/** Проверка одного ответа отключена до завершения попытки — используйте questionResults из POST /api/submit */
export async function POST(
  req: Request,
  { params }: { params: { testId: string } }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  return NextResponse.json(
    {
      ok: false,
      error:
        "Проверка отдельных ответов недоступна до завершения теста. Завершите тест, чтобы увидеть результаты.",
    },
    { status: 403 }
  );
}
