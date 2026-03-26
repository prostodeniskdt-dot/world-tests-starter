import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import Link from "next/link";
import { db } from "@/lib/db";
import { Martini } from "lucide-react";
import {
  AdminCocktailSubmissionsList,
  type CocktailSubmissionRow,
} from "@/components/AdminCocktailSubmissionsList";

export default async function AdminCocktailSubmissionsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) redirect("/");
  const payload = verifyToken(token);
  if (!payload || !payload.isAdmin) redirect("/");

  let rows: CocktailSubmissionRow[] = [];
  let categories: { id: number; name: string }[] = [];
  try {
    const [subRes, catRes] = await Promise.all([
      db.query(`
        SELECT s.id, s.name, s.slug, s.description, s.status, s.created_at, s.user_id,
               s.image_url, s.author, s.classic_original_author, s.is_classic, s.bar_name, s.bar_city, s.photo_rights_confirmed,
               u.first_name, u.last_name, u.email
        FROM cocktail_submissions s
        LEFT JOIN users u ON u.id = s.user_id
        ORDER BY s.created_at DESC
      `),
      db.query(`SELECT id, name FROM cocktail_categories ORDER BY sort_order ASC, id ASC`),
    ]);
    rows = subRes.rows as CocktailSubmissionRow[];
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
          <Martini className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Заявки на коктейли</h1>
            <p className="text-zinc-600 text-sm">Модерация рецептов от пользователей</p>
          </div>
        </div>
        <AdminCocktailSubmissionsList submissions={rows} categories={categories} />
      </div>
    </div>
  );
}
