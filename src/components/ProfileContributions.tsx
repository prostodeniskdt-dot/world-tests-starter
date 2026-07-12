import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, FileText, XCircle } from "lucide-react";
import type { Contribution } from "@/lib/user-contributions";

type ProfileContributionsProps = {
  items: Contribution[];
  unavailableKinds?: string[];
};

export function ProfileContributions({
  items,
  unavailableKinds = [],
}: ProfileContributionsProps) {
  const published = items.filter((item) => item.status === "approved").length;
  const pending = items.filter((item) => item.status === "pending").length;
  const rejected = items.filter((item) => item.status === "rejected").length;
  const recent = items.slice(0, 4);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-soft sm:p-6" aria-labelledby="contributions-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary-700">Ваши публикации</p>
          <h2 id="contributions-heading" className="mt-1 text-xl font-bold text-zinc-950 sm:text-2xl">
            Мои материалы
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Материалы, отзывы и заявки из всех разделов.
          </p>
        </div>
        <Link
          href="/profile/materials"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary-700 hover:underline"
        >
          Открыть все
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl bg-emerald-50 p-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          <div className="mt-2 text-xl font-bold text-emerald-950">{published}</div>
          <div className="text-xs text-emerald-800">Опубликовано</div>
        </div>
        <div className="rounded-xl bg-amber-50 p-3">
          <Clock3 className="h-4 w-4 text-amber-700" aria-hidden="true" />
          <div className="mt-2 text-xl font-bold text-amber-950">{pending}</div>
          <div className="text-xs text-amber-800">На проверке</div>
        </div>
        <div className="rounded-xl bg-red-50 p-3">
          <XCircle className="h-4 w-4 text-red-700" aria-hidden="true" />
          <div className="mt-2 text-xl font-bold text-red-950">{rejected}</div>
          <div className="text-xs text-red-800">Отклонено</div>
        </div>
      </div>

      {unavailableKinds.length > 0 && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Не удалось проверить часть разделов: {unavailableKinds.join(", ")}.
        </p>
      )}

      {recent.length > 0 ? (
        <ul className="mt-5 divide-y divide-zinc-100 border-t border-zinc-100">
          {recent.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <FileText className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-zinc-900">{item.title}</div>
                <div className="text-xs text-zinc-500">{item.kindLabel}</div>
              </div>
              {item.publicHref ? (
                <Link href={item.publicHref} className="text-xs font-semibold text-primary-700 hover:underline">
                  Открыть
                </Link>
              ) : (
                <span className="text-xs text-zinc-500">
                  {item.status === "pending" ? "На модерации" : "Отклонено"}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-zinc-300 p-5 text-center">
          <p className="text-sm text-zinc-600">Вы ещё не предлагали материалы.</p>
          <Link href="/knowledge/submit" className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-primary-700">
            Добавить первый материал
          </Link>
        </div>
      )}
    </section>
  );
}
