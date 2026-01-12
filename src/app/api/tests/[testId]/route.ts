import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(
  req: Request,
  { params }: { params: { testId: string } }
) {
  const { testId } = params;

  // Получаем тест
  const { data: test, error: testError } = await supabaseAdmin
    .from("tests")
    .select("*")
    .eq("id", testId)
    .eq("is_active", true)
    .single();

  if (testError || !test) {
    return NextResponse.json(
      { ok: false, error: "Тест не найден" },
      { status: 404 }
    );
  }

  // Получаем вопросы
  const { data: questions, error: questionsError } = await supabaseAdmin
    .from("test_questions")
    .select("*")
    .eq("test_id", testId)
    .order("question_order", { ascending: true });

  if (questionsError) {
    return NextResponse.json(
      { ok: false, error: questionsError.message },
      { status: 500 }
    );
  }

  // Получаем варианты ответов для каждого вопроса
  const questionIds = (questions || []).map((q) => q.id);
  const { data: options, error: optionsError } = await supabaseAdmin
    .from("test_options")
    .select("*")
    .in("question_id", questionIds)
    .order("option_order", { ascending: true });

  if (optionsError) {
    return NextResponse.json(
      { ok: false, error: optionsError.message },
      { status: 500 }
    );
  }

  // Формируем структуру теста (без правильных ответов)
  const testData = {
    id: test.id,
    title: test.title,
    description: test.description,
    questions: (questions || []).map((q) => ({
      id: q.id,
      text: q.question_text,
      options: (options || [])
        .filter((opt) => opt.question_id === q.id)
        .map((opt) => opt.option_text),
    })),
  };

  return NextResponse.json({ ok: true, test: testData });
}
