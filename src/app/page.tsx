import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  LibraryBig,
  Medal,
  MessageSquareText,
} from "lucide-react";
import { NAVIGATION_GROUPS, SECTIONS } from "@/lib/sections";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants";
import { getHomeData } from "@/lib/home-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${SITE_NAME} — напитки, сервис и работа заведений`,
  description: SITE_DESCRIPTION,
};

const SCENARIOS = [
  {
    title: "Разобраться в теме",
    description: "Пройдите тест или почитайте статьи. Результаты тестов сохраняются в профиле.",
    href: "/tests",
    action: "Перейти к тестам",
    icon: BookOpen,
  },
  {
    title: "Быстро найти нужное",
    description: "Сочетания вкусов, рецепты, техника, посуда и заготовки собраны по разделам.",
    href: "/pairings",
    action: "Открыть справочники",
    icon: BriefcaseBusiness,
  },
  {
    title: "Добавить своё",
    description: "Можно предложить статью, рецепт, заготовку или карточку оборудования.",
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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-accent-900 px-6 py-12 text-white sm:px-12 sm:py-16 bg-hero-warm animate-fade-in">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(28,25,23,0.15)_0%,transparent_45%)]" />
        <div className="relative max-w-3xl animate-slide-up">
          <p className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-primary-300">
            {SITE_NAME}
          </p>
          <h1 className="mt-4 font-display text-display text-white">
            О напитках и работе в индустрии
          </h1>
          <p className="mt-5 max-w-xl text-body-lg text-stone-300">
            Здесь можно проверить знания, найти нужный рецепт или приём и добавить свой материал.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/tests"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3 text-sm font-bold text-stone-950 transition-all hover:bg-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 focus:ring-offset-accent-900 shadow-lift"
            >
              Проверить знания
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/knowledge/submit"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
            >
              Добавить материал
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16" aria-labelledby="start-heading">
        <div className="mb-8 max-w-2xl">
          <p className="eyebrow">С чего начать</p>
          <h2 id="start-heading" className="mt-2 font-display text-h2 text-stone-950">
            Выберите, что нужно сейчас
          </h2>
          <p className="mt-3 text-body text-stone-600">
            Начните с тестов, откройте справочник или предложите свой материал.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {SCENARIOS.map(({ title, description, href, action, icon: Icon }, index) => (
            <article
              key={title}
              className="flex flex-col border-b border-stone-300/80 pb-6 md:border-b-0 md:border-r md:pr-6 md:last:border-r-0 md:last:pr-0 animate-slide-up"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-900 text-primary-400">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="font-display text-h3 text-stone-950">{title}</h3>
              <p className="mt-2 flex-1 text-body-sm text-stone-600">{description}</p>
              <Link
                href={href}
                className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary-800 hover:text-primary-950"
              >
                {action}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
        <section aria-labelledby="community-heading">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Обновления</p>
              <h2 id="community-heading" className="mt-2 font-display text-h2 text-stone-950">
                Недавно добавили
              </h2>
            </div>
            <Link
              href="/knowledge"
              className="hidden text-sm font-semibold text-primary-800 hover:underline sm:block"
            >
              Все материалы
            </Link>
          </div>

          {latest.length > 0 ? (
            <div className="divide-y divide-stone-200 border-y border-stone-200">
              {latest.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group flex flex-col gap-1 py-5 transition-colors hover:bg-surface-muted/60 px-1 sm:px-2"
                >
                  <span className="font-mono text-[0.7rem] font-medium uppercase tracking-wider text-primary-700">
                    {item.kind}
                  </span>
                  <h3 className="font-display text-lg font-semibold text-stone-950 group-hover:text-primary-900">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="line-clamp-2 text-sm leading-relaxed text-stone-600">
                      {item.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-surface-raised p-7">
              <LibraryBig className="h-7 w-7 text-stone-400" aria-hidden="true" />
              <h3 className="mt-4 font-display text-lg font-semibold text-stone-900">
                Здесь пока пусто
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Если у вас есть статья или разбор, предложите его — после проверки он появится здесь.
              </p>
              <Link
                href="/knowledge/submit"
                className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary-800"
              >
                Предложить материал
              </Link>
            </div>
          )}
        </section>

        <aside className="surface-card p-5 sm:p-6" aria-labelledby="leaders-heading">
          <div className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-primary-600" aria-hidden="true" />
            <h2 id="leaders-heading" className="font-display text-lg font-semibold text-stone-950">
              Лидеры тестов
            </h2>
          </div>
          {leaders.length > 0 ? (
            <ol className="mt-4 space-y-2">
              {leaders.map((leader) => (
                <li
                  key={leader.userId}
                  className="flex items-center gap-3 rounded-xl bg-surface-muted px-3 py-3"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-900 font-mono text-xs font-bold text-primary-300">
                    {leader.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-stone-900">
                      {leader.displayName}
                    </div>
                    <div className="font-mono text-xs text-stone-500">
                      {leader.totalPoints.toLocaleString("ru-RU")} очков · {leader.testsCompleted}{" "}
                      тестов
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-stone-600">
              Пройдите тест и разрешите показывать результат, чтобы попасть в рейтинг.
            </p>
          )}
          <Link
            href="/tests#leaderboard"
            className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary-800 hover:underline"
          >
            Открыть рейтинг
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </aside>
      </div>

      <section className="pt-14 sm:pt-20" aria-labelledby="possibilities-heading">
        <p className="eyebrow">Навигация</p>
        <h2 id="possibilities-heading" className="mt-2 font-display text-h2 text-stone-950">
          Все разделы
        </h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {catalogGroups.map((group) => (
            <div key={group.id}>
              <h3 className="font-display text-h3 text-stone-950">{group.title}</h3>
              <p className="mt-1 text-sm text-stone-500">{group.description}</p>
              <div className="mt-4 space-y-0.5 border-t border-stone-200 pt-3">
                {group.items.map((item) => {
                  const section = SECTIONS.find((candidate) => candidate.id === item.sectionId);
                  const Icon = section?.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="flex min-h-11 items-center gap-3 rounded-lg px-1 text-sm font-medium text-stone-700 hover:text-primary-900"
                    >
                      {Icon && <Icon className="h-4 w-4 text-primary-600" aria-hidden="true" />}
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
