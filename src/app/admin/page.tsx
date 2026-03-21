import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import { AdminUsersTable } from "@/components/AdminUsersTable";
import { db } from "@/lib/db";
import { Shield, Users, FileText, Wine, Coffee, Wrench, Martini, UtensilsCrossed, Library, Bell } from "lucide-react";
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

  const { rows: pendingSubmissions } = await db.query(
    `SELECT COUNT(*) AS c FROM article_submissions WHERE status = 'pending'`
  );
  const pendingCount = parseInt((pendingSubmissions[0] as { c: string })?.c || "0", 10);

  let pendingCocktailCount = 0;
  try {
    const { rows: pc } = await db.query(
      `SELECT COUNT(*) AS c FROM cocktail_submissions WHERE status = 'pending'`
    );
    pendingCocktailCount = parseInt((pc[0] as { c: string })?.c || "0", 10);
  } catch {
    pendingCocktailCount = 0;
  }

  let pendingAlcoholCount = 0;
  try {
    const { rows: pa } = await db.query(
      `SELECT COUNT(*) AS c FROM alcohol_submissions WHERE status = 'pending'`
    );
    pendingAlcoholCount = parseInt((pa[0] as { c: string })?.c || "0", 10);
  } catch {
    pendingAlcoholCount = 0;
  }

  let pendingNaCount = 0;
  try {
    const { rows: pn } = await db.query(
      `SELECT COUNT(*) AS c FROM na_submissions WHERE status = 'pending'`
    );
    pendingNaCount = parseInt((pn[0] as { c: string })?.c || "0", 10);
  } catch {
    pendingNaCount = 0;
  }

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

        {(pendingCount > 0 ||
          pendingCocktailCount > 0 ||
          pendingAlcoholCount > 0 ||
          pendingNaCount > 0) && (
          <div className="mb-6 space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {pendingCount > 0 && (
              <div>
                <Link
                  href="/admin/knowledge/submissions"
                  className="font-semibold text-amber-900 hover:underline"
                >
                  Ожидают модерации статей в базу знаний: {pendingCount}. Открыть заявки →
                </Link>
              </div>
            )}
            {pendingCocktailCount > 0 && (
              <div>
                <Link
                  href="/admin/cocktails/submissions"
                  className="font-semibold text-amber-900 hover:underline"
                >
                  Ожидают модерации коктейлей: {pendingCocktailCount}. Открыть заявки →
                </Link>
              </div>
            )}
            {pendingAlcoholCount > 0 && (
              <div>
                <Link
                  href="/admin/alcohol/submissions"
                  className="font-semibold text-amber-900 hover:underline"
                >
                  Ожидают модерации алкоголя: {pendingAlcoholCount}. Открыть заявки →
                </Link>
              </div>
            )}
            {pendingNaCount > 0 && (
              <div>
                <Link
                  href="/admin/na/submissions"
                  className="font-semibold text-amber-900 hover:underline"
                >
                  Ожидают модерации Б/А: {pendingNaCount}. Открыть заявки →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Быстрые ссылки */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            href="/admin/tests"
            className="flex items-center gap-3 bg-white rounded-lg border border-zinc-200 shadow-sm p-4 hover:border-primary-300 hover:shadow-md transition-all"
          >
            <FileText className="h-8 w-8 text-primary-600" />
            <div>
              <div className="font-semibold text-zinc-900">Тесты</div>
              <div className="text-sm text-zinc-500">Импорт, редактирование</div>
            </div>
          </Link>
          <Link
            href="/admin/knowledge/submissions"
            className="flex items-center gap-3 bg-white rounded-lg border border-zinc-200 shadow-sm p-4 hover:border-primary-300 hover:shadow-md transition-all relative"
          >
            <Bell className="h-8 w-8 text-primary-600" />
            <div>
              <div className="font-semibold text-zinc-900">Заявки на статьи (UGC)</div>
              <div className="text-sm text-zinc-500">Модерация статей</div>
            </div>
            {pendingCount > 0 && (
              <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {pendingCount}
              </span>
            )}
          </Link>
          <Link
            href="/admin/knowledge"
            className="flex items-center gap-3 bg-white rounded-lg border border-zinc-200 shadow-sm p-4 hover:border-primary-300 hover:shadow-md transition-all"
          >
            <Library className="h-8 w-8 text-primary-600" />
            <div>
              <div className="font-semibold text-zinc-900">База знаний</div>
              <div className="text-sm text-zinc-500">Статьи</div>
            </div>
          </Link>
          <Link
            href="/admin/alcohol/submissions"
            className="flex items-center gap-3 bg-white rounded-lg border border-zinc-200 shadow-sm p-4 hover:border-primary-300 hover:shadow-md transition-all relative"
          >
            <Wine className="h-8 w-8 text-primary-600" />
            <div>
              <div className="font-semibold text-zinc-900">Заявки на алкоголь</div>
              <div className="text-sm text-zinc-500">Модерация UGC</div>
            </div>
            {pendingAlcoholCount > 0 && (
              <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {pendingAlcoholCount}
              </span>
            )}
          </Link>
          <Link
            href="/admin/alcohol"
            className="flex items-center gap-3 bg-white rounded-lg border border-zinc-200 shadow-sm p-4 hover:border-primary-300 hover:shadow-md transition-all"
          >
            <Wine className="h-8 w-8 text-primary-600" />
            <div>
              <div className="font-semibold text-zinc-900">Алкоголь</div>
              <div className="text-sm text-zinc-500">Каталог</div>
            </div>
          </Link>
          <Link
            href="/admin/na/submissions"
            className="flex items-center gap-3 bg-white rounded-lg border border-zinc-200 shadow-sm p-4 hover:border-primary-300 hover:shadow-md transition-all relative"
          >
            <Coffee className="h-8 w-8 text-primary-600" />
            <div>
              <div className="font-semibold text-zinc-900">Заявки на Б/А</div>
              <div className="text-sm text-zinc-500">Модерация UGC</div>
            </div>
            {pendingNaCount > 0 && (
              <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {pendingNaCount}
              </span>
            )}
          </Link>
          <Link
            href="/admin/na"
            className="flex items-center gap-3 bg-white rounded-lg border border-zinc-200 shadow-sm p-4 hover:border-primary-300 hover:shadow-md transition-all"
          >
            <Coffee className="h-8 w-8 text-primary-600" />
            <div>
              <div className="font-semibold text-zinc-900">Б/а</div>
              <div className="text-sm text-zinc-500">Каталог</div>
            </div>
          </Link>
          <Link
            href="/admin/technique"
            className="flex items-center gap-3 bg-white rounded-lg border border-zinc-200 shadow-sm p-4 hover:border-primary-300 hover:shadow-md transition-all"
          >
            <Wrench className="h-8 w-8 text-primary-600" />
            <div>
              <div className="font-semibold text-zinc-900">Техника</div>
              <div className="text-sm text-zinc-500">Каталог</div>
            </div>
          </Link>
          <Link
            href="/admin/cocktails/submissions"
            className="flex items-center gap-3 bg-white rounded-lg border border-zinc-200 shadow-sm p-4 hover:border-primary-300 hover:shadow-md transition-all relative"
          >
            <Martini className="h-8 w-8 text-primary-600" />
            <div>
              <div className="font-semibold text-zinc-900">Заявки на коктейли</div>
              <div className="text-sm text-zinc-500">Модерация UGC</div>
            </div>
            {pendingCocktailCount > 0 && (
              <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {pendingCocktailCount}
              </span>
            )}
          </Link>
          <Link
            href="/admin/cocktails"
            className="flex items-center gap-3 bg-white rounded-lg border border-zinc-200 shadow-sm p-4 hover:border-primary-300 hover:shadow-md transition-all"
          >
            <Martini className="h-8 w-8 text-primary-600" />
            <div>
              <div className="font-semibold text-zinc-900">Коктейли</div>
              <div className="text-sm text-zinc-500">Каталог</div>
            </div>
          </Link>
          <Link
            href="/admin/glassware"
            className="flex items-center gap-3 bg-white rounded-lg border border-zinc-200 shadow-sm p-4 hover:border-primary-300 hover:shadow-md transition-all"
          >
            <UtensilsCrossed className="h-8 w-8 text-primary-600" />
            <div>
              <div className="font-semibold text-zinc-900">Посуда</div>
              <div className="text-sm text-zinc-500">Каталог</div>
            </div>
          </Link>
          <div className="flex items-center gap-3 bg-white rounded-lg border border-zinc-200 shadow-sm p-4">
            <Users className="h-8 w-8 text-zinc-600" />
            <div>
              <div className="font-semibold text-zinc-900">Пользователи</div>
              <div className="text-sm text-zinc-500">Управление</div>
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
