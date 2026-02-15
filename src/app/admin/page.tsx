import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import { AdminUsersTable } from "@/components/AdminUsersTable";
import { db } from "@/lib/db";
import { Shield, Users, FileText } from "lucide-react";
import Link from "next/link";

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
  const { rows: initialUsers } = await db.query(
    `SELECT id, email, first_name, last_name, telegram_username, is_admin, is_banned, banned_until, created_at
     FROM users ORDER BY created_at DESC LIMIT 50`
  );

  // Получаем статистику
  const userIds = initialUsers.map((u: any) => u.id);
  let statsMap = new Map<string, { totalPoints: number; testsCompleted: number }>();

  if (userIds.length > 0) {
    const { rows: stats } = await db.query(
      `SELECT user_id, total_points, tests_completed FROM user_stats WHERE user_id = ANY($1)`,
      [userIds]
    );
    statsMap = new Map(
      stats.map((s: any) => [
        s.user_id,
        {
          totalPoints: s.total_points,
          testsCompleted: s.tests_completed,
        },
      ])
    );
  }

  const usersWithStats = initialUsers.map((user: any) => ({
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

  const { rows: countRows } = await db.query(
    `SELECT COUNT(*) AS count FROM users`
  );
  const totalCount = parseInt(countRows[0]?.count || "0", 10);

  const initialPagination = {
    page: 1,
    limit: 50,
    total: totalCount,
    totalPages: Math.ceil(totalCount / 50),
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-zinc-900">Админ-панель</h1>
          </div>
          <p className="text-zinc-600">
            Управление пользователями и модерация системы
          </p>
        </div>

        {/* Быстрые ссылки */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link
            href="/admin/tests"
            className="flex items-center gap-3 bg-white rounded-lg border border-zinc-200 shadow-sm p-4 hover:border-primary-300 hover:shadow-md transition-all"
          >
            <FileText className="h-8 w-8 text-primary-600" />
            <div>
              <div className="font-semibold text-zinc-900">Управление тестами</div>
              <div className="text-sm text-zinc-500">Импорт, редактирование, публикация</div>
            </div>
          </Link>
          <div className="flex items-center gap-3 bg-white rounded-lg border border-zinc-200 shadow-sm p-4">
            <Users className="h-8 w-8 text-zinc-600" />
            <div>
              <div className="font-semibold text-zinc-900">Пользователи</div>
              <div className="text-sm text-zinc-500">Управление и модерация</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-5 w-5 text-zinc-600" />
            <h2 className="text-xl font-semibold text-zinc-900">Пользователи</h2>
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
