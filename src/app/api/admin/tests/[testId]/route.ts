import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-middleware";
import { normalizeTestContentFromDb } from "@/lib/test-runtime-normalize";
import { validateTestForServer, formatValidationIssues } from "@/lib/test-import/validate-server";

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
    const { questions, answerKey } = normalizeTestContentFromDb(r.questions, r.answer_key);
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
        questions,
        answerKey,
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

  const { title, description, category, author, difficultyLevel, basePoints, maxAttempts, questions, answerKey } = body;
  let questionsToSave = questions;
  let answerKeyToSave = answerKey;

  try {
    if (questions !== undefined && answerKey !== undefined && Array.isArray(questions) && questions.length > 0) {
      const { rows: current } = await db.query(`SELECT title, description, category, author, difficulty_level, base_points, max_attempts FROM tests WHERE id = $1`, [testId]);
      const cur = current[0] ?? {};
      const validation = validateTestForServer({
        title: title ?? cur.title,
        description: description ?? cur.description,
        category: category ?? cur.category,
        author: author ?? cur.author,
        difficultyLevel: difficultyLevel ?? cur.difficulty_level,
        basePoints: basePoints ?? cur.base_points,
        maxAttempts: maxAttempts ?? cur.max_attempts,
        questions,
        answerKey,
      });
      if (!validation.ok) {
        return NextResponse.json(
          { ok: false, error: formatValidationIssues(validation.issues), issues: validation.issues },
          { status: 400 }
        );
      }
      questionsToSave = validation.payload?.questions ?? questions;
      answerKeyToSave = validation.payload?.answerKey ?? answerKey;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (title !== undefined) { updates.push(`title = $${idx++}`); values.push(title); }
    if (description !== undefined) { updates.push(`description = $${idx++}`); values.push(description); }
    if (category !== undefined) { updates.push(`category = $${idx++}`); values.push(category); }
    if (author !== undefined) { updates.push(`author = $${idx++}`); values.push(author); }
    if (difficultyLevel !== undefined) { updates.push(`difficulty_level = $${idx++}`); values.push(difficultyLevel); }
    if (basePoints !== undefined) { updates.push(`base_points = $${idx++}`); values.push(basePoints); }
    if (maxAttempts !== undefined) { updates.push(`max_attempts = $${idx++}`); values.push(maxAttempts); }
    if (questions !== undefined) { updates.push(`questions = $${idx++}`); values.push(JSON.stringify(questionsToSave)); }
    if (answerKey !== undefined) { updates.push(`answer_key = $${idx++}`); values.push(JSON.stringify(answerKeyToSave)); }

    updates.push(`updated_at = now()`);

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
