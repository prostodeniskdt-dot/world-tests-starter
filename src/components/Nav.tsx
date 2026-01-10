import Link from "next/link";

export function Nav() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-semibold">
          World Tests
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/test" className="hover:underline">
            Тест
          </Link>
          <Link href="/leaderboard" className="hover:underline">
            Рейтинг
          </Link>
        </nav>
      </div>
    </header>
  );
}
