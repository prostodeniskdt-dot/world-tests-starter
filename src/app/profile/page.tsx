import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { Trophy, Award, Calendar, ExternalLink } from "lucide-react";

export const revalidate = 10;

type Attempt = {
  id: string;
  test_id: string;
  score_percent: number;
  points_awarded: number;
  created_at: string;
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { userId?: string };
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const currentUser = token ? verifyToken(token) : null;
  
  const userId = searchParams.userId || currentUser?.userId;

  if (!userId) {
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

  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    notFound();
  }

  const { data: stats } = await supabaseAdmin
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  const { data: attempts } = await supabaseAdmin
    .from("attempts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const attemptsList = (attempts || []) as Attempt[];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-4 sm:p-6">
        <div className="flex items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full gradient-primary flex items-center justify-center text-primary-600 text-xl sm:text-2xl md:text-3xl font-bold shadow-lg flex-shrink-0">
            {user.first_name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-zinc-900 mb-1">
              {user.first_name} {user.last_name}
            </h1>
            <div className="text-zinc-600 mb-2">{user.email}</div>
            {user.telegram_username && (
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
      </div>

      {attemptsList.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
            История попыток
          </h2>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            {/* Мобильный вид - карточки */}
            <div className="block sm:hidden space-y-3 px-4">
              {attemptsList.map((attempt) => (
                <div key={attempt.id} className="border border-zinc-200 rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-zinc-900 text-sm truncate flex-1 min-w-0 pr-2">{attempt.test_id}</div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                      attempt.score_percent >= 80 
                        ? "bg-green-100 text-success"
                        : attempt.score_percent >= 60
                        ? "bg-yellow-100 text-warning"
                        : "bg-red-100 text-error"
                    }`}>
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
                </div>
              ))}
            </div>

            {/* Десктопный вид - таблица */}
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
                    <tr key={attempt.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3 text-zinc-700">
                        {new Date(attempt.created_at).toLocaleDateString("ru-RU", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900">{attempt.test_id}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          attempt.score_percent >= 80 
                            ? "bg-green-100 text-success"
                            : attempt.score_percent >= 60
                            ? "bg-yellow-100 text-warning"
                            : "bg-red-100 text-error"
                        }`}>
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
