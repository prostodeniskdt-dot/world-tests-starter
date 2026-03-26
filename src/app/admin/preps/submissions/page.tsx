import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import Link from "next/link";
import { db } from "@/lib/db";
import { Package } from "lucide-react";
import { AdminPrepSubmissionsList, type PrepSubmissionRow } from "@/components/AdminPrepSubmissionsList";

export default async function AdminPrepSubmissionsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) redirect("/");
  const payload = verifyToken(token);
  if (!payload || !payload.isAdmin) redirect("/");

  let rows: PrepSubmissionRow[] = [];
  let categories: { id: number; name: string }[] = [];

  try {
    const [subRes, catRes] = await Promise.all([
      db.query(`
        SELECT s.id, s.name, s.slug, s.status, s.created_at,
               s.user_id, s.image_url, s.category_id, s.photo_rights_confirmed,
               s.author, s.bar_name, s.bar_city, s.composition, s.tags,
               c.name AS category_name,
               u.first_name, u.last_name, u.email
        FROM prep_submissions s
        LEFT JOIN prep_categories c ON c.id = s.category_id
        LEFT JOIN users u ON u.id = s.user_id
        ORDER BY s.created_at DESC
      `),
      db.query(`SELECT id, name FROM prep_categories ORDER BY sort_order ASC, id ASC`),
    ]);
    rows = subRes.rows as PrepSubmissionRow[];
    categories = catRes.rows as { id: number; name: string }[];
  } catch {
    rows = [];
    categories = [];
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/admin/preps" className="text-sm text-primary-600 hover:underline mb-4 inline-block">
          ← Каталог заготовок
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <Package className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-zinc-900">Заявки на заготовки (UGC)</h1>
        </div>

        <AdminPrepSubmissionsList submissions={rows} categories={categories} />
      </div>
    </div>
  );
}

