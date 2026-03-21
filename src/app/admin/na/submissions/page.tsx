import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import Link from "next/link";
import { db } from "@/lib/db";
import { Coffee } from "lucide-react";
import { AdminNASubmissionsList, type NASubmissionRow } from "@/components/AdminNASubmissionsList";

export default async function AdminNASubmissionsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) redirect("/");
  const payload = verifyToken(token);
  if (!payload || !payload.isAdmin) redirect("/");

  let rows: NASubmissionRow[] = [];
  let categories: { id: number; name: string }[] = [];
  try {
    const [subRes, catRes] = await Promise.all([
      db.query(`
        SELECT s.id, s.name, s.slug, s.description, s.country, s.producer, s.status, s.created_at,
               s.user_id, s.image_url, s.category_id, s.photo_rights_confirmed,
               c.name AS category_name,
               u.first_name, u.last_name, u.email
        FROM na_submissions s
        LEFT JOIN na_categories c ON c.id = s.category_id
        LEFT JOIN users u ON u.id = s.user_id
        ORDER BY s.created_at DESC
      `),
      db.query(`SELECT id, name FROM na_categories ORDER BY sort_order ASC, id ASC`),
    ]);
    rows = subRes.rows as NASubmissionRow[];
    categories = catRes.rows as { id: number; name: string }[];
  } catch {
    rows = [];
    categories = [];
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/admin" className="text-sm text-primary-600 hover:underline mb-4 inline-block">
          ← Админ-панель
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <Coffee className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Заявки на карточки Б/А</h1>
            <p className="text-zinc-600 text-sm">Модерация UGC</p>
          </div>
        </div>
        <AdminNASubmissionsList submissions={rows} categories={categories} />
      </div>
    </div>
  );
}
