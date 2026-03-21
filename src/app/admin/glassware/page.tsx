import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import Link from "next/link";
import { UtensilsCrossed, ImagePlus } from "lucide-react";

export default async function AdminGlasswarePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) redirect("/");
  const payload = verifyToken(token);
  if (!payload || !payload.isAdmin) redirect("/");

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/admin" className="text-sm text-primary-600 hover:underline mb-4 inline-block">
          ← Админ-панель
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <UtensilsCrossed className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Посуда</h1>
            <p className="text-zinc-600 text-sm">Модерация UGC</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/glassware/submissions"
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-5 hover:border-primary-300 shadow-sm"
          >
            <UtensilsCrossed className="h-10 w-10 text-primary-600 shrink-0" />
            <div>
              <div className="font-semibold text-zinc-900">Заявки на карточки</div>
              <div className="text-sm text-zinc-500">Модерация заявок посуды</div>
            </div>
          </Link>
          <Link
            href="/admin/glassware/drink-photos"
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-5 hover:border-primary-300 shadow-sm"
          >
            <ImagePlus className="h-10 w-10 text-primary-600 shrink-0" />
            <div>
              <div className="font-semibold text-zinc-900">Фото с напитками</div>
              <div className="text-sm text-zinc-500">Галерея UGC на карточках</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
