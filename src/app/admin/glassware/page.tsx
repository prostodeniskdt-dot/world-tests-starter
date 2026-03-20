import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";

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
          <h1 className="text-2xl font-bold text-zinc-900">Каталог посуды</h1>
        </div>
        <p className="text-zinc-600">
          Добавление и редактирование — раздел в разработке. Таблицы: glassware, glassware_categories.
        </p>
      </div>
    </div>
  );
}
