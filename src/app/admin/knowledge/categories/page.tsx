import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/jwt";
import { AdminKnowledgeCategories } from "@/components/AdminKnowledgeCategories";
import { FolderTree } from "lucide-react";

export default async function AdminKnowledgeCategoriesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) redirect("/");
  const payload = verifyToken(token);
  if (!payload || !payload.isAdmin) redirect("/");

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/admin/knowledge" className="text-sm text-primary-600 hover:underline mb-4 inline-block">
          ← База знаний
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <FolderTree className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Категории базы знаний</h1>
            <p className="text-zinc-600 text-sm">Создание, порядок и slug для фильтров на сайте</p>
          </div>
        </div>
        <AdminKnowledgeCategories />
      </div>
    </div>
  );
}
