import Link from "next/link";
import { Wrench, GraduationCap } from "lucide-react";

export default function TechniqueHubPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
        Техника и навыки
      </h1>
      <p className="text-zinc-600 leading-relaxed mb-10 max-w-2xl">
        Два направления: оборудование для бара и кухни и практические приёмы работы. Карточки связаны между
        собой и с другими разделами сайта.
      </p>

      <div className="grid sm:grid-cols-2 gap-6">
        <Link
          href="/technique/equipment"
          className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:border-primary-300 hover:shadow-md transition-all flex flex-col"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-xl bg-primary-50 p-3 text-primary-600">
              <Wrench className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 group-hover:text-primary-700">Оборудование</h2>
          </div>
          <p className="text-sm text-zinc-600 flex-1">
            Каталог техники: модели, характеристики, опыт использования, отзывы и связь с приёмами, где
            используется это железо.
          </p>
          <span className="text-sm font-medium text-primary-600 mt-4 group-hover:underline">
            Перейти в каталог →
          </span>
        </Link>

        <Link
          href="/technique/skills"
          className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:border-primary-300 hover:shadow-md transition-all flex flex-col"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-xl bg-accent-50 p-3 text-accent-600">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 group-hover:text-primary-700">
              Приёмы и техники
            </h2>
          </div>
          <p className="text-sm text-zinc-600 flex-1">
            Мини-гайды: пошаговые инструкции, типичные ошибки, видео и связи с оборудованием, ингредиентами и
            рецептами.
          </p>
          <span className="text-sm font-medium text-primary-600 mt-4 group-hover:underline">
            Перейти к приёмам →
          </span>
        </Link>
      </div>

      <div className="mt-10 flex flex-wrap gap-3 text-sm">
        <Link
          href="/technique/equipment/submit"
          className="text-primary-600 hover:underline"
        >
          Предложить оборудование
        </Link>
        <span className="text-zinc-300">|</span>
        <Link href="/technique/skills/submit" className="text-primary-600 hover:underline">
          Предложить приём
        </Link>
      </div>
    </div>
  );
}
