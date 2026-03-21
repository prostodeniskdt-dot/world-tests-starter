import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import Link from "next/link";
import { Coffee } from "lucide-react";

export default async function AdminNAPage() {
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
          <Coffee className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-zinc-900">Каталог Б/а</h1>
        </div>
        <p className="text-zinc-600 mb-4">
          Публикация карточек — через заявки пользователей и модерацию. Прямое редактирование в админке можно
          добавить позже.
        </p>
        <Link
          href="/admin/na/submissions"
          className="inline-flex rounded-lg bg-primary-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-primary-700"
        >
          Заявки на карточки Б/А
        </Link>
      </div>
    </div>
  );
}
