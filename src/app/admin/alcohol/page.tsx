import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import Link from "next/link";
import { Wine } from "lucide-react";

export default async function AdminAlcoholPage() {
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
          <Wine className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-zinc-900">Каталог алкоголя</h1>
        </div>
        <p className="text-zinc-600 mb-4">
          <Link href="/admin/alcohol/submissions" className="text-primary-600 hover:underline font-medium">
            Модерация заявок на карточки алкоголя (UGC)
          </Link>
        </p>
        <p className="text-zinc-600">
          Добавление и редактирование каталога напрямую — раздел в разработке. Таблицы: alcohol_products,
          alcohol_categories.
        </p>
        <p className="text-sm text-zinc-500 mt-4">
          Для загрузки изображений админом: <code className="bg-zinc-100 px-1 rounded">POST /api/upload</code>.
        </p>
      </div>
    </div>
  );
}
