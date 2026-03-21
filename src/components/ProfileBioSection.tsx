"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addToast } from "./Toast";
import { buttonStyles } from "@/lib/button-styles";
import { Spinner } from "./Spinner";

type Props = {
  isOwnProfile: boolean;
  initialAbout: string | null;
  initialAchievements: string | null;
};

export function ProfileBioSection({ isOwnProfile, initialAbout, initialAchievements }: Props) {
  const router = useRouter();
  const [about, setAbout] = useState(initialAbout ?? "");
  const [achievements, setAchievements] = useState(initialAchievements ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAbout(initialAbout ?? "");
    setAchievements(initialAchievements ?? "");
  }, [initialAbout, initialAchievements]);

  if (!isOwnProfile) {
    const a = (initialAbout ?? "").trim();
    const ach = (initialAchievements ?? "").trim();
    if (!a && !ach) return null;
    return (
      <div className="mt-4 space-y-4 rounded-lg border border-zinc-200 bg-zinc-50/90 p-4 sm:p-5">
        {a ? (
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 mb-2">О себе</h2>
            <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{a}</p>
          </div>
        ) : null}
        {ach ? (
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 mb-2">Достижения</h2>
            <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{ach}</p>
          </div>
        ) : null}
      </div>
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          profile_about: about,
          profile_achievements: achievements,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        addToast(data.error || "Не удалось сохранить", "error");
        return;
      }
      addToast("Сохранено", "success");
      router.refresh();
    } catch {
      addToast("Ошибка сети", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-zinc-900 mb-1">О себе и достижения</h2>
      <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
        Этот текст увидят другие пользователи, когда откроют ваш профиль — например, по ссылке со статьи
        в базе знаний. Без HTML, до 4000 символов в каждом поле.
      </p>
      <div className="space-y-3">
        <div>
          <label htmlFor="profile-about" className="block text-xs font-medium text-zinc-600 mb-1">
            О себе
          </label>
          <textarea
            id="profile-about"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={5}
            maxLength={4000}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Коротко: кто вы, чем занимаетесь в индустрии…"
          />
        </div>
        <div>
          <label htmlFor="profile-achievements" className="block text-xs font-medium text-zinc-600 mb-1">
            Достижения
          </label>
          <textarea
            id="profile-achievements"
            value={achievements}
            onChange={(e) => setAchievements(e.target.value)}
            rows={4}
            maxLength={4000}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Курсы, награды, опыт, который хотите показать коллегам…"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className={`${buttonStyles.primary} mt-4 min-h-[44px] px-5 text-sm inline-flex items-center gap-2`}
      >
        {saving ? <Spinner size="sm" /> : null}
        Сохранить текст профиля
      </button>
    </div>
  );
}
