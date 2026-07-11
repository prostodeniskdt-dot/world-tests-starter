import Link from "next/link";
import { ClipboardList, FilePlus2, FolderOpen, LibraryBig } from "lucide-react";

const DASHBOARD_LINKS = [
  {
    id: "materials",
    title: "Мои материалы",
    description: "Публикации и статусы заявок",
    href: "/profile/materials",
    icon: FolderOpen,
  },
  {
    id: "submit",
    title: "Поделиться опытом",
    description: "Предложить новый материал",
    href: "/knowledge/submit",
    icon: FilePlus2,
  },
  {
    id: "tests",
    title: "Продолжить обучение",
    description: "Тесты и мировой рейтинг",
    href: "/tests",
    icon: ClipboardList,
  },
  {
    id: "knowledge",
    title: "База знаний",
    description: "Материалы от коллег",
    href: "/knowledge",
    icon: LibraryBig,
  },
] as const;

/** Основные действия пользователя вместо дублирования всей навигации сайта. */
export function ProfileDashboardLinks() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">Рабочее пространство</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {DASHBOARD_LINKS.map(({ id, title, description, href, icon: Icon }) => (
          <Link
            key={id}
            href={href}
            className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 min-h-[56px] text-sm font-medium text-zinc-800 hover:border-primary-300 hover:bg-primary-50/80 transition-colors"
          >
            <Icon className="h-5 w-5 text-primary-600 flex-shrink-0" aria-hidden />
            <span className="min-w-0">
              <span className="block font-semibold text-zinc-900">{title}</span>
              <span className="block truncate text-xs font-normal text-zinc-500">{description}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
