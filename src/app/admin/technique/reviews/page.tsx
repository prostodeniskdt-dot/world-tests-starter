import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import Link from "next/link";
import { db } from "@/lib/db";
import { Star } from "lucide-react";
import { AdminEquipmentReviewsList, type EquipmentReviewRow } from "@/components/AdminEquipmentReviewsList";

export default async function AdminEquipmentReviewsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) redirect("/");
  const payload = verifyToken(token);
  if (!payload || !payload.isAdmin) redirect("/");

  let rows: EquipmentReviewRow[] = [];
  try {
    const { rows: r } = await db.query(`
      SELECT r.id, r.equipment_id, r.user_id, r.rating, r.review_text, r.usage_duration,
             r.created_at, r.status,
             e.name AS equipment_name, e.slug AS equipment_slug,
             u.first_name, u.last_name, u.email
      FROM equipment_reviews r
      JOIN equipment e ON e.id = r.equipment_id
      JOIN users u ON u.id = r.user_id
      WHERE r.status = 'pending'
      ORDER BY r.created_at ASC
    `);
    rows = r as EquipmentReviewRow[];
  } catch {
    rows = [];
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/admin" className="text-sm text-primary-600 hover:underline mb-4 inline-block">
          ← Админ-панель
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <Star className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Отзывы на оборудование</h1>
            <p className="text-zinc-600 text-sm">Модерация</p>
          </div>
        </div>
        <AdminEquipmentReviewsList reviews={rows} />
      </div>
    </div>
  );
}
