import Link from "next/link";
import { SECTIONS } from "@/lib/sections";

/** Быстрые ссылки на разделы сайта из личного кабинета */
export function ProfileDashboardLinks() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">Разделы сайта</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
        {SECTIONS.map(({ id, title, href, icon: Icon }) => (
          <Link
            key={id}
            href={href}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 min-h-[44px] text-sm font-medium text-zinc-800 hover:border-primary-300 hover:bg-primary-50/80 transition-colors"
          >
            <Icon className="h-4 w-4 text-primary-600 flex-shrink-0" aria-hidden />
            <span className="truncate">{title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
