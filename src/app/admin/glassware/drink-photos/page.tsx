import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import Link from "next/link";
import { db } from "@/lib/db";
import { ImagePlus } from "lucide-react";
import {
  AdminGlasswareDrinkPhotosList,
  type GlasswareDrinkPhotoRow,
} from "@/components/AdminGlasswareDrinkPhotosList";

export default async function AdminGlasswareDrinkPhotosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) redirect("/");
  const payload = verifyToken(token);
  if (!payload || !payload.isAdmin) redirect("/");

  let rows: GlasswareDrinkPhotoRow[] = [];
  try {
    const { rows: r } = await db.query(`
      SELECT p.id, p.glassware_id, p.image_url, p.caption, p.created_at,
             g.name AS glassware_name, g.slug AS glassware_slug,
             u.first_name, u.last_name
      FROM glassware_drink_photos p
      JOIN glassware g ON g.id = p.glassware_id
      JOIN users u ON u.id = p.user_id
      WHERE p.status = 'pending'
      ORDER BY p.created_at ASC
    `);
    rows = r as GlasswareDrinkPhotoRow[];
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
          <ImagePlus className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Фото с напитками</h1>
            <p className="text-zinc-600 text-sm">Модерация UGC галереи</p>
          </div>
        </div>
        <AdminGlasswareDrinkPhotosList photos={rows} />
      </div>
    </div>
  );
}
