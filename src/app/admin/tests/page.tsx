import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";
import { AdminTestsList } from "@/components/AdminTestsList";
import { FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function AdminTestsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) redirect("/");
  const payload = verifyToken(token);
  if (!payload || !payload.isAdmin) redirect("/");

  const { rows } = await db.query(
    `SELECT id, title, description, category, difficulty_level, base_points, max_attempts,
            is_published, created_at, updated_at,
            jsonb_array_length(questions) as question_count
     FROM tests ORDER BY created_at DESC`
  );

  const tests = rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    author: "",
    difficultyLevel: r.difficulty_level,
    basePoints: r.base_points,
    maxAttempts: r.max_attempts,
    isPublished: r.is_published,
    questionCount: r.question_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Назад в админку
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-8 w-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-zinc-900">Управление тестами</h1>
          </div>
          <p className="text-zinc-600">Создание, редактирование и публикация тестов</p>
        </div>

        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm p-6">
          <AdminTestsList initialTests={tests} />
        </div>
      </div>
    </div>
  );
}
