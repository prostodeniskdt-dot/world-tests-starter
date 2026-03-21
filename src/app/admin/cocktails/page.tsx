import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import Link from "next/link";
import { Martini } from "lucide-react";

export default async function AdminCocktailsPage() {
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
          <Martini className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-zinc-900">Каталог коктейлей</h1>
        </div>
        <p className="text-zinc-600 mb-4">
          <Link href="/admin/cocktails/submissions" className="text-primary-600 hover:underline font-medium">
            Модерация заявок на коктейли (UGC)
          </Link>
        </p>
        <p className="text-zinc-600">
          Добавление и редактирование каталога напрямую — раздел в разработке. Таблицы: cocktails,
          cocktail_categories.
        </p>
      </div>
    </div>
  );
}
