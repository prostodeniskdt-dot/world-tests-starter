import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-middleware";

// GET - получить тест для редактирования (с ответами)
export async function GET(
  req: Request,
  { params }: { params: { testId: string } }
) {
  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { testId } = params;

  try {
    const { rows } = await db.query(
      `SELECT * FROM tests WHERE id = $1 LIMIT 1`,
      [testId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Тест не найден" },
        { status: 404 }
      );
    }

    const r = rows[0];
    return NextResponse.json({
      ok: true,
      test: {
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        author: r.author ?? "",
        difficultyLevel: r.difficulty_level,
        basePoints: r.base_points,
        maxAttempts: r.max_attempts,
        questions: r.questions,
        answerKey: r.answer_key,
        isPublished: r.is_published,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

// PUT - обновить тест
export async function PUT(
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

  const { title, description, category, difficultyLevel, basePoints, maxAttempts, questions, answerKey } = body;

  try {
    // Строим запрос динамически -- обновляем только переданные поля
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (title !== undefined) { updates.push(`title = $${idx++}`); values.push(title); }
    if (description !== undefined) { updates.push(`description = $${idx++}`); values.push(description); }
    if (category !== undefined) { updates.push(`category = $${idx++}`); values.push(category); }
    if (difficultyLevel !== undefined) { updates.push(`difficulty_level = $${idx++}`); values.push(difficultyLevel); }
    if (basePoints !== undefined) { updates.push(`base_points = $${idx++}`); values.push(basePoints); }
    if (maxAttempts !== undefined) { updates.push(`max_attempts = $${idx++}`); values.push(maxAttempts); }
    if (questions !== undefined) { updates.push(`questions = $${idx++}`); values.push(JSON.stringify(questions)); }
    if (answerKey !== undefined) { updates.push(`answer_key = $${idx++}`); values.push(JSON.stringify(answerKey)); }

    if (updates.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Нет данных для обновления" },
        { status: 400 }
      );
    }

    values.push(testId);
    const { rowCount } = await db.query(
      `UPDATE tests SET ${updates.join(", ")} WHERE id = $${idx}`,
      values
    );

    if (rowCount === 0) {
      return NextResponse.json(
        { ok: false, error: "Тест не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

// DELETE - удалить тест
export async function DELETE(
  req: Request,
  { params }: { params: { testId: string } }
) {
  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { testId } = params;

  try {
    const { rowCount } = await db.query(
      `DELETE FROM tests WHERE id = $1`,
      [testId]
    );

    if (rowCount === 0) {
      return NextResponse.json(
        { ok: false, error: "Тест не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
