import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-middleware";
import { validateTestForServer, formatValidationIssues } from "@/lib/test-import/validate-server";

export async function POST(
  req: Request,
  { params }: { params: { testId: string } }
) {
  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { testId } = params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Невалидный JSON" },
      { status: 400 }
    );
  }

  const { published } = body;
  if (typeof published !== "boolean") {
    return NextResponse.json(
      { ok: false, error: "Укажите published: true/false" },
      { status: 400 }
    );
  }

  try {
    if (published) {
      const { rows } = await db.query(`SELECT * FROM tests WHERE id = $1 LIMIT 1`, [testId]);
      if (rows.length === 0) {
        return NextResponse.json({ ok: false, error: "Тест не найден" }, { status: 404 });
      }
      const r = rows[0];
      const questions = r.questions ?? [];
      if (!Array.isArray(questions) || questions.length === 0) {
        return NextResponse.json(
          { ok: false, error: "Нельзя опубликовать тест без вопросов" },
          { status: 400 }
        );
      }
      const validation = validateTestForServer({
        title: r.title,
        description: r.description,
        category: r.category,
        author: r.author,
        difficultyLevel: r.difficulty_level,
        basePoints: r.base_points,
        maxAttempts: r.max_attempts,
        questions,
        answerKey: r.answer_key ?? {},
      });
      if (!validation.ok) {
        return NextResponse.json(
          { ok: false, error: formatValidationIssues(validation.issues), issues: validation.issues },
          { status: 400 }
        );
      }
    }

    const { rowCount } = await db.query(
      `UPDATE tests SET is_published = $1, updated_at = now() WHERE id = $2`,
      [published, testId]
    );

    if (rowCount === 0) {
      return NextResponse.json(
        { ok: false, error: "Тест не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, published });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
