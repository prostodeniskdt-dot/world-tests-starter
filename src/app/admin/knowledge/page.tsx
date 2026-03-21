import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import Link from "next/link";
import { Library } from "lucide-react";

export default async function AdminKnowledgePage() {
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
          <Library className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-zinc-900">База знаний</h1>
        </div>
        <p className="text-zinc-600 mb-4">
          Управление статьями. UGC-заявки модерируются в разделе «Заявки на статьи».
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/knowledge/submissions"
            className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Заявки на публикацию
          </Link>
          <Link
            href="/admin/knowledge/categories"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Категории
          </Link>
        </div>
      </div>
    </div>
  );
}
