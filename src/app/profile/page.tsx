import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { Trophy, Award, Calendar, ExternalLink, BarChart3, FileDown } from "lucide-react";
import { ProfileDeleteAccount } from "@/components/ProfileDeleteAccount";
import { ProfileFilters } from "@/components/ProfileFilters";
import { ProfileExportPdf } from "@/components/ProfileExportPdf";
import { ProfileAppearancePanel } from "@/components/ProfileAppearancePanel";
import { ProfileDashboardLinks } from "@/components/ProfileDashboardLinks";
import { Suspense } from "react";

export const revalidate = 10;

type Attempt = {
  id: string;
  test_id: string;
  test_title: string;
  score_percent: number;
  points_awarded: number;
  created_at: string;
};

type CategoryStat = {
  category: string;
  attempts_count: number;
  unique_tests: number;
  avg_score: number;
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{
    userId?: string;
    fromDate?: string;
    toDate?: string;
    testId?: string;
    minScore?: string;
    maxScore?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const currentUser = token ? verifyToken(token) : null;

  const requestedUserId = params.userId;
  const userId = requestedUserId || currentUser?.userId;

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4">Личный кабинет</h1>
          <p className="mt-2 text-zinc-600">
            Пожалуйста, войдите в систему для просмотра профиля.
          </p>
        </div>
      </div>
    );
  }

  if (!userId) {
    notFound();
  }

  const { rows: userRows } = await db.query(
    `SELECT * FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );
  const user = userRows[0];

  if (!user) {
    notFound();
  }

  const { rows: statsRows } = await db.query(
    `SELECT * FROM user_stats WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  const stats = statsRows[0] || null;

  // Параметры фильтрации и сортировки
  const fromDate = params.fromDate || "";
  const toDate = params.toDate || "";
  const filterTestId = params.testId || "";
  const minScore = params.minScore ? parseInt(params.minScore, 10) : null;
  const maxScore = params.maxScore ? parseInt(params.maxScore, 10) : null;
  const sortBy = params.sortBy === "points" ? "points" : params.sortBy === "percent" ? "percent" : "date";
  const sortOrder = params.sortOrder === "asc" ? "ASC" : "DESC";

  // Запрос попыток: только по существующим тестам (INNER JOIN), с фильтрами и сортировкой
  const conditions: string[] = ["a.user_id = $1", "t.id IS NOT NULL"];
  const values: (string | number)[] = [userId];
  let paramIdx = 2;

  if (fromDate) {
    conditions.push(`a.created_at >= $${paramIdx}::date`);
    values.push(fromDate);
    paramIdx++;
  }
  if (toDate) {
    conditions.push(`a.created_at <= ($${paramIdx}::date + interval '1 day')`);
    values.push(toDate);
    paramIdx++;
  }
  if (filterTestId) {
    conditions.push(`a.test_id = $${paramIdx}`);
    values.push(filterTestId);
    paramIdx++;
  }
  if (minScore !== null && !Number.isNaN(minScore)) {
    conditions.push(`a.score_percent >= $${paramIdx}`);
    values.push(minScore);
    paramIdx++;
  }
  if (maxScore !== null && !Number.isNaN(maxScore)) {
    conditions.push(`a.score_percent <= $${paramIdx}`);
    values.push(maxScore);
    paramIdx++;
  }

  const orderColumn =
    sortBy === "points" ? "a.points_awarded" : sortBy === "percent" ? "a.score_percent" : "a.created_at";

  const { rows: attemptRows } = await db.query(
    `SELECT a.id, a.test_id, a.score_percent, a.points_awarded, a.created_at, t.title as test_title
     FROM attempts a
     INNER JOIN tests t ON t.id = a.test_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY ${orderColumn} ${sortOrder}
     LIMIT 50`,
    values
  );
  const attemptsList = (attemptRows || []) as Attempt[];

  // Аналитика по категориям (только по существующим тестам)
  const { rows: categoryRows } = await db.query(
    `SELECT t.category, COUNT(*)::int as attempts_count, COUNT(DISTINCT a.test_id)::int as unique_tests, ROUND(AVG(a.score_percent), 1)::float as avg_score
     FROM attempts a
     INNER JOIN tests t ON t.id = a.test_id
     WHERE a.user_id = $1
     GROUP BY t.category
     ORDER BY attempts_count DESC`,
    [userId]
  );
  const categoryStats = (categoryRows || []) as CategoryStat[];

  // Тесты для выпадающего списка фильтра (все уникальные из попыток пользователя)
  const { rows: testOptionsRows } = await db.query(
    `SELECT DISTINCT t.id, t.title FROM attempts a
     INNER JOIN tests t ON t.id = a.test_id
     WHERE a.user_id = $1 ORDER BY t.title`,
    [userId]
  );
  const testOptions = (testOptionsRows || []).map((r: { id: string; title: string }) => ({
    id: r.id,
    title: r.title,
  }));

  const isOwnProfile = currentUser.userId === userId;
  const consentPublicRating = Boolean(user.consent_public_rating);
  const displayName =
    user.telegram_username?.trim()
      ? user.telegram_username
      : `${user.first_name || ""} ${(user.last_name || "").charAt(0) || ""}.`.trim() || "Участник";
  const showPublicInfo = isOwnProfile || consentPublicRating;

  const profileBasePath = "/profile";

  const avatarUrl = user.avatar_url as string | null | undefined;
  const coverUrl = user.profile_cover_url as string | null | undefined;
  const showAvatarImage = Boolean(avatarUrl && (isOwnProfile || showPublicInfo));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 min-w-0">
      {isOwnProfile && <ProfileDashboardLinks />}

      <div className="rounded-xl border border-zinc-200 bg-white shadow-soft overflow-hidden">
        {isOwnProfile && coverUrl ? (
          <div className="relative h-28 sm:h-40 bg-zinc-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        ) : null}

        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
            {showAvatarImage && avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full object-cover shadow-lg flex-shrink-0 ring-2 ring-white"
              />
            ) : (
              <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full gradient-primary flex items-center justify-center text-primary-600 text-xl sm:text-2xl md:text-3xl font-bold shadow-lg flex-shrink-0">
                {(showPublicInfo ? (displayName || user.first_name || "?").charAt(0) : "?").toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-zinc-900 mb-1">
                {isOwnProfile
                  ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                  : showPublicInfo
                    ? displayName
                    : "Участник"}
              </h1>
              {isOwnProfile && <div className="text-zinc-600 mb-2 break-all">{user.email}</div>}
              {showPublicInfo && user.telegram_username && (
                <a
                  href={`https://t.me/${user.telegram_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-zinc-600 hover:underline"
                >
                  @{user.telegram_username}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          {isOwnProfile && (
            <ProfileAppearancePanel hasAvatar={Boolean(avatarUrl)} hasCover={Boolean(coverUrl)} />
          )}

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
            <div className="rounded-lg border-2 border-primary-200 bg-gradient-to-br from-zinc-900 to-zinc-800 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="h-6 w-6 text-primary-600" />
                <div className="text-sm font-medium text-zinc-600">Всего очков</div>
              </div>
              <div className="text-4xl font-bold text-zinc-600">{stats.total_points.toLocaleString()}</div>
            </div>

            <div className="rounded-lg border-2 border-success-200 bg-gradient-to-br from-green-50 to-green-100 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Award className="h-6 w-6 text-success" />
                <div className="text-sm font-medium text-zinc-600">Тестов пройдено</div>
              </div>
              <div className="text-4xl font-bold text-success">{stats.tests_completed}</div>
            </div>
          </div>
        )}
        {isOwnProfile && !user.delete_requested_at && <ProfileDeleteAccount />}
        </div>
      </div>

      {/* Аналитика по категориям */}
      {categoryStats.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
            Статистика по категориям
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryStats.map((cat) => (
              <div
                key={cat.category || "без категории"}
                className="rounded-lg border border-zinc-200 p-4 bg-zinc-50"
              >
                <div className="font-semibold text-zinc-900">
                  {cat.category || "Без категории"}
                </div>
                <div className="text-sm text-zinc-600 mt-1">
                  Попыток: {cat.attempts_count} · Тестов: {cat.unique_tests}
                </div>
                <div className="text-sm font-medium text-primary-600 mt-1">
                  Средний балл: {cat.avg_score}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {attemptsList.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
              История попыток
            </h2>
            {isOwnProfile && (
              <ProfileExportPdf
                attempts={attemptsList}
                userName={`${user.first_name || ""} ${user.last_name || ""}`.trim()}
              />
            )}
          </div>

          <Suspense fallback={null}>
            <ProfileFilters basePath={profileBasePath} userId={requestedUserId} testOptions={testOptions} />
          </Suspense>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="block sm:hidden space-y-3 px-4">
              {attemptsList.map((attempt) => (
                <Link
                  key={attempt.id}
                  href={`/profile/attempt/${attempt.id}${requestedUserId ? `?userId=${requestedUserId}` : ""}`}
                  className="block border border-zinc-200 rounded-lg p-4 bg-white hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-zinc-900 text-sm truncate flex-1 min-w-0 pr-2">
                      {attempt.test_title}
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                        attempt.score_percent >= 80
                          ? "bg-green-100 text-success"
                          : attempt.score_percent >= 60
                            ? "bg-yellow-100 text-warning"
                            : "bg-red-100 text-error"
                      }`}
                    >
                      {attempt.score_percent}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-zinc-600">
                    <span>
                      {new Date(attempt.created_at).toLocaleDateString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="font-bold text-primary-600">+{attempt.points_awarded}</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="hidden sm:block inline-block min-w-full align-middle">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-zinc-700">Дата</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700">Тест</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700">Результат</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700 text-right">Очки</th>
                  </tr>
                </thead>
                <tbody>
                  {attemptsList.map((attempt) => (
                    <tr
                      key={attempt.id}
                      className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-zinc-700">
                        {new Date(attempt.created_at).toLocaleDateString("ru-RU", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        <Link
                          href={`/test?testId=${attempt.test_id}`}
                          className="text-primary-600 hover:underline"
                        >
                          {attempt.test_title}
                        </Link>
                        <span className="ml-2 text-zinc-400">·</span>
                        <Link
                          href={`/profile/attempt/${attempt.id}${requestedUserId ? `?userId=${requestedUserId}` : ""}`}
                          className="ml-1 text-xs text-zinc-500 hover:underline"
                        >
                          детали
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            attempt.score_percent >= 80
                              ? "bg-green-100 text-success"
                              : attempt.score_percent >= 60
                                ? "bg-yellow-100 text-warning"
                                : "bg-red-100 text-error"
                          }`}
                        >
                          {attempt.score_percent}%
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-primary-600 text-right">
                        +{attempt.points_awarded}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {attemptsList.length === 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-12 text-center">
          <Trophy className="h-16 w-16 text-zinc-300 mx-auto mb-4" />
          <div className="text-zinc-600 mb-4">Пока нет попыток.</div>
          <Link
            href="/test"
            className="inline-flex items-center gap-2 rounded-lg gradient-primary px-6 py-3 text-sm font-semibold text-primary-600 hover:opacity-90 shadow-md hover:shadow-lg transition-all"
          >
            Пройдите тест
          </Link>
        </div>
      )}
    </div>
  );
}
