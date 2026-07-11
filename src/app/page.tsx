import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  LibraryBig,
  Medal,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { NAVIGATION_GROUPS, SECTIONS } from "@/lib/sections";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants";
import { getHomeData } from "@/lib/home-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${SITE_NAME} — сообщество барменов`,
  description: SITE_DESCRIPTION,
};

const SCENARIOS = [
  {
    title: "Учиться и проверять знания",
    description: "Проходите профессиональные тесты, изучайте статьи и отслеживайте свой прогресс.",
    href: "/tests",
    action: "Перейти к тестам",
    icon: BookOpen,
  },
  {
    title: "Решать задачи за баром",
    description: "Используйте сочетания вкусов, техники, рецепты и справочники во время работы.",
    href: "/pairings",
    action: "Открыть практику",
    icon: BriefcaseBusiness,
  },
  {
    title: "Делиться опытом",
    description: "Публикуйте статьи, авторские коктейли, заготовки и рекомендации для коллег.",
    href: "/knowledge/submit",
    action: "Предложить материал",
    icon: MessageSquareText,
  },
] as const;

export default async function HomePage() {
  const { latest, leaders } = await getHomeData();
  const catalogGroups = NAVIGATION_GROUPS.filter((group) =>
    ["learn", "practice", "reference"].includes(group.id)
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-200">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            Опыт барменов — для барменов
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Профессиональное сообщество, которое помогает расти в профессии
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            Проверяйте знания, находите рабочие решения и делитесь практическим опытом
            с коллегами из индустрии.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/tests"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-zinc-950"
            >
              Проверить знания
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/knowledge/submit"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
            >
              Поделиться опытом
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14" aria-labelledby="start-heading">
        <div className="mb-6">
          <p className="text-sm font-semibold text-primary-700">С чего начать</p>
          <h2 id="start-heading" className="mt-1 text-2xl font-bold text-zinc-950 sm:text-3xl">
            Один сайт — три рабочих сценария
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {SCENARIOS.map(({ title, description, href, action, icon: Icon }) => (
            <article key={title} className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-amber-400">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-zinc-950">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600">{description}</p>
              <Link
                href={href}
                className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-900"
              >
                {action}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
        <section aria-labelledby="community-heading">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary-700">Живой опыт</p>
              <h2 id="community-heading" className="mt-1 text-2xl font-bold text-zinc-950">
                Свежее от сообщества
              </h2>
            </div>
            <Link href="/knowledge" className="hidden text-sm font-semibold text-primary-700 hover:underline sm:block">
              Все материалы
            </Link>
          </div>

          {latest.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {latest.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-primary-300"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                    {item.kind}
                  </span>
                  <h3 className="mt-2 font-bold text-zinc-950 group-hover:text-primary-800">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-600">
                      {item.description}
                    </p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-zinc-500">
                    Открыть
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-7">
              <LibraryBig className="h-7 w-7 text-zinc-400" aria-hidden="true" />
              <h3 className="mt-4 font-bold text-zinc-900">Раздел наполняется участниками</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Станьте одним из первых авторов и поделитесь материалом с коллегами.
              </p>
              <Link
                href="/knowledge/submit"
                className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary-700"
              >
                Предложить материал
              </Link>
            </div>
          )}
        </section>

        <aside className="rounded-2xl border border-zinc-200 bg-white p-5" aria-labelledby="leaders-heading">
          <div className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-amber-600" aria-hidden="true" />
            <h2 id="leaders-heading" className="text-lg font-bold text-zinc-950">
              Лидеры тестов
            </h2>
          </div>
          {leaders.length > 0 ? (
            <ol className="mt-4 space-y-2">
              {leaders.map((leader) => (
                <li key={leader.userId} className="flex items-center gap-3 rounded-lg bg-zinc-50 px-3 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
                    {leader.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-zinc-900">{leader.displayName}</div>
                    <div className="text-xs text-zinc-500">
                      {leader.totalPoints.toLocaleString("ru-RU")} очков · {leader.testsCompleted} тестов
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-zinc-600">
              Пройдите тест и разрешите показывать результат, чтобы попасть в рейтинг.
            </p>
          )}
          <Link
            href="/tests#leaderboard"
            className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary-700 hover:underline"
          >
            Открыть рейтинг
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </aside>
      </div>

      <section className="pt-12 sm:pt-16" aria-labelledby="possibilities-heading">
        <p className="text-sm font-semibold text-primary-700">Все возможности</p>
        <h2 id="possibilities-heading" className="mt-1 text-2xl font-bold text-zinc-950 sm:text-3xl">
          Структура без лишнего шума
        </h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {catalogGroups.map((group) => (
            <div key={group.id} className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h3 className="font-bold text-zinc-950">{group.title}</h3>
              <p className="mt-1 text-sm text-zinc-500">{group.description}</p>
              <div className="mt-4 space-y-1">
                {group.items.map((item) => {
                  const section = SECTIONS.find((candidate) => candidate.id === item.sectionId);
                  const Icon = section?.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-primary-800"
                    >
                      {Icon && <Icon className="h-4 w-4 text-zinc-400" aria-hidden="true" />}
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
