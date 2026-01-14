import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import { AdminUsersTable } from "@/components/AdminUsersTable";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Shield, Users } from "lucide-react";

export default async function AdminPage() {
  // Проверяем авторизацию и админские права
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/");
  }

  const payload = verifyToken(token);
  if (!payload || !payload.isAdmin) {
    redirect("/");
  }

  // Получаем начальные данные пользователей
  const { data: initialUsers, error } = await supabaseAdmin
    .from("users")
    .select("id, email, first_name, last_name, telegram_username, is_admin, is_banned, banned_until, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  // Получаем статистику
  const userIds = (initialUsers || []).map((u) => u.id);
  const { data: stats } = await supabaseAdmin
    .from("user_stats")
    .select("user_id, total_points, tests_completed")
    .in("user_id", userIds);

  const statsMap = new Map(
    (stats || []).map((s) => [
      s.user_id,
      {
        totalPoints: s.total_points,
        testsCompleted: s.tests_completed,
      },
    ])
  );

  const usersWithStats = (initialUsers || []).map((user) => ({
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    telegramUsername: user.telegram_username,
    isAdmin: user.is_admin,
    isBanned: user.is_banned,
    bannedUntil: user.banned_until,
    createdAt: user.created_at,
    stats: statsMap.get(user.id) || {
      totalPoints: 0,
      testsCompleted: 0,
    },
  }));

  const { count: totalCount } = await supabaseAdmin
    .from("users")
    .select("*", { count: "exact", head: true });

  const initialPagination = {
    page: 1,
    limit: 50,
    total: totalCount || 0,
    totalPages: Math.ceil((totalCount || 0) / 50),
  };

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-red-500" />
            <h1 className="text-3xl font-bold text-zinc-100">Админ-панель</h1>
          </div>
          <p className="text-zinc-400">
            Управление пользователями и модерация системы
          </p>
        </div>

        <div className="bg-zinc-950 rounded-lg border border-zinc-800 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-5 w-5 text-zinc-400" />
            <h2 className="text-xl font-semibold text-zinc-100">Пользователи</h2>
          </div>
          <AdminUsersTable
            initialUsers={usersWithStats}
            initialPagination={initialPagination}
          />
        </div>
      </div>
    </div>
  );
}
