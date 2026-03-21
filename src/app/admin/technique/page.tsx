import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import Link from "next/link";
import { Wrench, GraduationCap, Star } from "lucide-react";

export default async function AdminTechniqueHubPage() {
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
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Техника и навыки</h1>
        <p className="text-zinc-600 text-sm mb-8">Модерация UGC и отзывов</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/technique/equipment-submissions"
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-5 hover:border-primary-300 shadow-sm"
          >
            <Wrench className="h-10 w-10 text-primary-600 shrink-0" />
            <div>
              <div className="font-semibold text-zinc-900">Заявки: оборудование</div>
              <div className="text-sm text-zinc-500">Карточки техники</div>
            </div>
          </Link>
          <Link
            href="/admin/technique/guide-submissions"
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-5 hover:border-primary-300 shadow-sm"
          >
            <GraduationCap className="h-10 w-10 text-primary-600 shrink-0" />
            <div>
              <div className="font-semibold text-zinc-900">Заявки: приёмы</div>
              <div className="text-sm text-zinc-500">Техники и гайды</div>
            </div>
          </Link>
          <Link
            href="/admin/technique/reviews"
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-5 hover:border-primary-300 shadow-sm sm:col-span-2"
          >
            <Star className="h-10 w-10 text-amber-500 shrink-0" />
            <div>
              <div className="font-semibold text-zinc-900">Отзывы на оборудование</div>
              <div className="text-sm text-zinc-500">Одобрение пользовательских оценок</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
