import Link from "next/link";
import { Wrench, GraduationCap } from "lucide-react";

export default function TechniqueHubPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Wrench className="h-8 w-8 text-primary-600" aria-hidden="true" />
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            Техника и навыки
          </h1>
        </div>
        <p className="text-zinc-600 leading-relaxed max-w-2xl">
          Два направления: оборудование для бара и кухни и практические приёмы работы. Карточки связаны между
          собой и с другими разделами сайта.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <Link
          href="/technique/equipment"
          className="group flex flex-col rounded-xl border-2 border-zinc-200 bg-white p-6 hover:border-primary-300 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 text-primary-600 mb-4 group-hover:bg-primary-200">
            <Wrench className="h-6 w-6" aria-hidden />
          </div>
          <h2 className="font-bold text-lg text-zinc-900 mb-2 group-hover:text-primary-700">Оборудование</h2>
          <p className="text-sm text-zinc-600 flex-1">
            Каталог техники: модели, характеристики, опыт использования, отзывы и связь с приёмами, где
            используется это железо.
          </p>
          <span className="mt-4 text-sm font-semibold text-primary-600 group-hover:underline">
            Перейти →
          </span>
        </Link>

        <Link
          href="/technique/skills"
          className="group flex flex-col rounded-xl border-2 border-zinc-200 bg-white p-6 hover:border-primary-300 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 text-primary-600 mb-4 group-hover:bg-primary-200">
            <GraduationCap className="h-6 w-6" aria-hidden />
          </div>
          <h2 className="font-bold text-lg text-zinc-900 mb-2 group-hover:text-primary-700">
            Приёмы и техники
          </h2>
          <p className="text-sm text-zinc-600 flex-1">
            Мини-гайды: пошаговые инструкции, типичные ошибки, видео и связи с оборудованием, ингредиентами и
            рецептами.
          </p>
          <span className="mt-4 text-sm font-semibold text-primary-600 group-hover:underline">
            Перейти →
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
