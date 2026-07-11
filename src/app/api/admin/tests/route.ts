import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-middleware";
import crypto from "crypto";
import { validateTestForServer, formatValidationIssues } from "@/lib/test-import/validate-server";

// GET - список всех тестов (включая неопубликованные)
export async function GET(req: Request) {
  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const { rows } = await db.query(
      `SELECT id, title, description, category, author, difficulty_level, base_points, max_attempts, 
              is_published, created_at, updated_at,
              jsonb_array_length(questions) as question_count
       FROM tests ORDER BY created_at DESC`
    );

    const tests = rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      author: r.author ?? "",
      difficultyLevel: r.difficulty_level,
      basePoints: r.base_points,
      maxAttempts: r.max_attempts,
      isPublished: r.is_published,
      questionCount: r.question_count,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json({ ok: true, tests });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

// POST - создать тест (из JSON)
export async function POST(req: Request) {
  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof NextResponse) return adminCheck;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Невалидный JSON" },
      { status: 400 }
    );
  }

  const { id, title, description, category, author, difficultyLevel, basePoints, maxAttempts, questions, answerKey } = body;

  if (!title || typeof title !== "string") {
    return NextResponse.json(
      { ok: false, error: "Обязательное поле: title (строка)" },
      { status: 400 }
    );
  }

  const questionsArr = Array.isArray(questions) ? questions : [];
  const answerKeyObj = typeof answerKey === "object" && !Array.isArray(answerKey) ? answerKey : {};
  let questionsToSave = questionsArr;
  let answerKeyToSave = answerKeyObj;

  if (questionsArr.length > 0) {
    const validation = validateTestForServer({
      title,
      description,
      category,
      author,
      difficultyLevel,
      basePoints,
      maxAttempts,
      questions: questionsArr,
      answerKey: answerKeyObj,
    });
    if (!validation.ok) {
      return NextResponse.json(
        { ok: false, error: formatValidationIssues(validation.issues), issues: validation.issues },
        { status: 400 }
      );
    }

    // Сохраняем именно проверенный канонический payload. Это гарантирует,
    // что hint/media и остальные допустимые поля проходят тот же pipeline,
    // который показан администратору в preview.
    questionsToSave = Array.isArray(validation.payload?.questions)
      ? validation.payload.questions
      : questionsArr;
    answerKeyToSave =
      validation.payload?.answerKey &&
      typeof validation.payload.answerKey === "object" &&
      !Array.isArray(validation.payload.answerKey)
        ? validation.payload.answerKey
        : answerKeyObj;
  }

  const testId = id || `test-${crypto.randomUUID().slice(0, 8)}`;

  try {
    const { rows: existing } = await db.query(
      `SELECT id FROM tests WHERE id = $1`,
      [testId]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { ok: false, error: `Тест с ID "${testId}" уже существует` },
        { status: 409 }
      );
    }

    await db.query(
      `INSERT INTO tests (id, title, description, category, author, difficulty_level, base_points, max_attempts, questions, answer_key, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false)`,
      [
        testId,
        title,
        description || "",
        category || "",
        author || "",
        difficultyLevel ?? 1,
        basePoints ?? 200,
        maxAttempts ?? null,
        JSON.stringify(questionsToSave),
        JSON.stringify(answerKeyToSave),
      ]
    );

    return NextResponse.json({ ok: true, testId });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
