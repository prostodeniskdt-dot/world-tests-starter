import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notFound } from "next/navigation";
import Link from "next/link";

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
  const userId = searchParams.userId;

  if (!userId) {
    return (
      <div className="space-y-6">
        <div className="rounded-md border bg-white p-4">
          <h1 className="text-2xl font-bold">Личный кабинет</h1>
          <p className="mt-2 text-zinc-600">
            Укажите userId в параметрах запроса для просмотра профиля.
          </p>
        </div>
      </div>
    );
  }

  // Получаем профиль пользователя
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    notFound();
  }

  // Получаем статистику
  const { data: stats } = await supabaseAdmin
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Получаем попытки
  const { data: attempts } = await supabaseAdmin
    .from("attempts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const attemptsList = (attempts || []) as Attempt[];

  return (
    <div className="space-y-6">
      <div className="rounded-md border bg-white p-4">
        <h1 className="text-2xl font-bold">Личный кабинет</h1>

        <div className="mt-4 space-y-3">
          {user.avatar_url && (
            <div>
              <img
                src={user.avatar_url}
                alt="Аватар"
                className="h-20 w-20 rounded-full object-cover"
              />
            </div>
          )}

          <div>
            <div className="text-sm text-zinc-600">Имя</div>
            <div className="font-medium">
              {user.first_name || "Не указано"}{" "}
              {user.last_name || ""}
            </div>
          </div>

          <div>
            <div className="text-sm text-zinc-600">Никнейм</div>
            <div className="font-medium">{user.username}</div>
          </div>

          {user.telegram_username && (
            <div>
              <div className="text-sm text-zinc-600">Telegram</div>
              <div className="font-medium">
                <a
                  href={`https://t.me/${user.telegram_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  @{user.telegram_username}
                </a>
              </div>
            </div>
          )}

          {stats && (
            <>
              <div>
                <div className="text-sm text-zinc-600">Всего очков</div>
                <div className="text-xl font-bold">{stats.total_points}</div>
              </div>

              <div>
                <div className="text-sm text-zinc-600">Тестов пройдено</div>
                <div className="text-xl font-bold">
                  {stats.tests_completed}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {attemptsList.length > 0 && (
        <div className="rounded-md border bg-white p-4">
          <h2 className="text-xl font-bold mb-4">История попыток</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-zinc-50">
                <tr>
                  <th className="px-4 py-2">Дата</th>
                  <th className="px-4 py-2">Тест</th>
                  <th className="px-4 py-2">Результат</th>
                  <th className="px-4 py-2">Очки</th>
                </tr>
              </thead>
              <tbody>
                {attemptsList.map((attempt) => (
                  <tr key={attempt.id} className="border-b last:border-b-0">
                    <td className="px-4 py-2">
                      {new Date(attempt.created_at).toLocaleDateString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-2">{attempt.test_id}</td>
                    <td className="px-4 py-2">{attempt.score_percent}%</td>
                    <td className="px-4 py-2 font-medium">
                      {attempt.points_awarded}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {attemptsList.length === 0 && (
        <div className="rounded-md border bg-white p-4 text-center text-zinc-600">
          Пока нет попыток.{" "}
          <Link href="/test" className="text-blue-600 hover:underline">
            Пройдите тест
          </Link>
        </div>
      )}
    </div>
  );
}
