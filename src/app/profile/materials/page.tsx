import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ChevronLeft, ChevronRight, ExternalLink, FileText, Pencil } from "lucide-react";
import { verifyToken } from "@/lib/jwt";
import {
  getUserContributions,
  type ContributionStatus,
} from "@/lib/user-contributions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Мои материалы",
  description: "Все материалы и заявки пользователя в одном месте",
};

const STATUS_OPTIONS: { value: "" | ContributionStatus; label: string }[] = [
  { value: "", label: "Все" },
  { value: "pending", label: "На модерации" },
  { value: "approved", label: "Опубликованы" },
  { value: "rejected", label: "Отклонены" },
];

const STATUS_STYLES: Record<ContributionStatus, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  rejected: "bg-red-50 text-red-800 ring-red-200",
};

const STATUS_LABELS: Record<ContributionStatus, string> = {
  pending: "На модерации",
  approved: "Опубликовано",
  rejected: "Отклонено",
};

function filterHref(status: string, page = 1) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/profile/materials${query ? `?${query}` : ""}`;
}

export default async function ProfileMaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const currentUser = token ? verifyToken(token) : null;

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h1 className="text-2xl font-bold text-zinc-950">Мои материалы</h1>
          <p className="mt-2 text-zinc-600">Войдите в систему, чтобы увидеть свои публикации и заявки.</p>
          <Link href="/" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-primary-700">
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  const result = await getUserContributions(currentUser.userId);
  const activeStatus = STATUS_OPTIONS.some((option) => option.value === params.status)
    ? (params.status as ContributionStatus | undefined) || ""
    : "";
  const filtered = activeStatus
    ? result.items.filter((item) => item.status === activeStatus)
    : result.items;
  const requestedPage = Number.parseInt(params.page || "1", 10);
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * limit, safePage * limit);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/profile" className="text-sm font-semibold text-primary-700 hover:underline">
            ← Профиль
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-zinc-950">Мои материалы</h1>
          <p className="mt-2 max-w-2xl text-zinc-600">
            Все публикации, отзывы и заявки на модерацию собраны в одном месте.
          </p>
        </div>
        <Link
          href="/knowledge/submit"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Поделиться опытом
        </Link>
      </div>

      <nav className="mt-7 flex flex-wrap gap-2" aria-label="Фильтр материалов по статусу">
        {STATUS_OPTIONS.map((option) => (
          <Link
            key={option.value || "all"}
            href={filterHref(option.value)}
            className={`rounded-full px-3 py-2 text-sm font-semibold ${
              activeStatus === option.value
                ? "bg-zinc-900 text-white"
                : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
            }`}
          >
            {option.label}
          </Link>
        ))}
      </nav>

      {result.unavailableKinds.length > 0 && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Часть разделов временно недоступна: {result.unavailableKinds.join(", ")}. Остальные материалы показаны ниже.
        </div>
      )}

      {pageItems.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <ul className="divide-y divide-zinc-100">
            {pageItems.map((item) => (
              <li key={item.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                      <FileText className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          {item.kindLabel}
                        </span>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[item.status]}`}>
                          {STATUS_LABELS[item.status]}
                        </span>
                      </div>
                      <h2 className="mt-1 truncate font-bold text-zinc-950">{item.title}</h2>
                      <p className="mt-1 text-xs text-zinc-500">
                        {new Date(item.createdAt).toLocaleDateString("ru-RU")}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.editHref && (
                      <Link
                        href={item.editHref}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Управлять
                      </Link>
                    )}
                    {item.publicHref && (
                      <Link
                        href={item.publicHref}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-zinc-900 px-3 text-sm font-semibold text-white hover:bg-zinc-800"
                      >
                        Открыть
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-zinc-400" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-zinc-900">Материалов с таким статусом нет</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Предложите статью, рецепт или профессиональную рекомендацию.
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-between" aria-label="Страницы материалов">
          {safePage > 1 ? (
            <Link
              href={filterHref(activeStatus, safePage - 1)}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Назад
            </Link>
          ) : <span />}
          <span className="text-sm text-zinc-500">{safePage} из {totalPages}</span>
          {safePage < totalPages ? (
            <Link
              href={filterHref(activeStatus, safePage + 1)}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700"
            >
              Далее
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : <span />}
        </nav>
      )}
    </div>
  );
}
