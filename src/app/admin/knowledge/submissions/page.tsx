import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";
import { AdminSubmissionsList } from "@/components/AdminSubmissionsList";
import { Bell } from "lucide-react";
import Link from "next/link";

export default async function AdminSubmissionsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) redirect("/");
  const payload = verifyToken(token);
  if (!payload || !payload.isAdmin) redirect("/");

  const { rows } = await db.query(
    `SELECT s.id, s.title, s.slug, s.excerpt, s.content, s.status, s.created_at, s.user_id,
            u.first_name, u.last_name, u.email
     FROM article_submissions s
     LEFT JOIN users u ON u.id = s.user_id
     ORDER BY s.created_at DESC`
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/admin" className="text-sm text-primary-600 hover:underline mb-4 inline-block">
          ← Админ-панель
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <Bell className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Заявки на публикацию статей</h1>
            <p className="text-zinc-600 text-sm">Модерация UGC-контента</p>
          </div>
        </div>
        <AdminSubmissionsList submissions={rows} />
      </div>
    </div>
  );
}
