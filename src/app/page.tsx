import Link from "next/link";

export default function Page() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">World Tests — демо</h1>

      <p className="text-zinc-700">
        Это базовый каркас: один тест, начисление очков и мировой рейтинг.
        Пользователь идентифицируется по <span className="font-medium">localStorage</span>
        (nickname + uuid), чтобы можно было быстро начать. Потом легко заменить на Supabase Auth.
      </p>

      <div className="flex gap-3">
        <Link
          href="/test"
          className="rounded-md bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800"
        >
          Пройти тест
        </Link>
        <Link
          href="/leaderboard"
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 hover:bg-zinc-50"
        >
          Смотреть рейтинг
        </Link>
      </div>

      <div className="rounded-md border bg-white p-4 text-sm text-zinc-700">
        <div className="font-medium mb-2">Что дальше обычно добавляют</div>
        <ul className="list-disc pl-5 space-y-1">
          <li>Сезоны (30/60/90 дней), награды, категории тестов</li>
          <li>Аутентификация (Supabase Auth), античит и правила повторных попыток</li>
          <li>Админка для добавления тестов</li>
        </ul>
      </div>
    </div>
  );
}
