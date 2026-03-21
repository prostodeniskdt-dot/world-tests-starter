"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocalUser } from "./UserGate";
import { addToast } from "./Toast";
import { buttonStyles } from "@/lib/button-styles";
import { Spinner } from "./Spinner";
import { ImageIcon, Trash2 } from "lucide-react";

type Props = {
  hasAvatar: boolean;
  hasCover: boolean;
};

export function ProfileAppearancePanel({ hasAvatar, hasCover }: Props) {
  const router = useRouter();
  const { user, setUser } = useLocalUser();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"avatar" | "cover" | "rm-avatar" | "rm-cover" | null>(null);

  const mergeUser = (avatarUrl: string | null, profileCoverUrl: string | null) => {
    if (!user) return;
    setUser({
      ...user,
      avatarUrl,
      profileCoverUrl,
    });
  };

  const upload = async (kind: "avatar" | "cover", file: File) => {
    setBusy(kind);
    try {
      const fd = new FormData();
      fd.set("kind", kind);
      fd.set("file", file);
      const res = await fetch("/api/profile/upload", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        addToast(data.error || "Не удалось загрузить", "error");
        return;
      }
      mergeUser(data.avatarUrl ?? null, data.profileCoverUrl ?? null);
      addToast(kind === "avatar" ? "Аватар обновлён" : "Обои обновлены", "success");
      router.refresh();
    } catch {
      addToast("Ошибка сети", "error");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (kind: "avatar" | "cover") => {
    const flag = kind === "avatar" ? "rm-avatar" : "rm-cover";
    setBusy(flag);
    try {
      const res = await fetch(`/api/profile/upload?kind=${kind}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        addToast(data.error || "Не удалось удалить", "error");
        return;
      }
      mergeUser(data.avatarUrl ?? null, data.profileCoverUrl ?? null);
      addToast(kind === "avatar" ? "Аватар удалён" : "Обои удалены", "success");
      router.refresh();
    } catch {
      addToast("Ошибка сети", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 mb-3">
        <ImageIcon className="h-4 w-4 text-primary-600" aria-hidden />
        Оформление кабинета
      </div>
      <p className="text-xs text-zinc-600 mb-3">
        Аватар и фон видны в вашем кабинете; аватар также в меню. Нужен настроенный S3 (как для загрузок в
        базе знаний).
      </p>
      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void upload("avatar", f);
          }}
        />
        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void upload("cover", f);
          }}
        />
        <button
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          disabled={busy !== null}
          className={`${buttonStyles.secondary} text-xs sm:text-sm min-h-[44px]`}
        >
          {busy === "avatar" ? <Spinner size="sm" /> : "Загрузить аватар"}
        </button>
        {hasAvatar && (
          <button
            type="button"
            onClick={() => void remove("avatar")}
            disabled={busy !== null}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-red-700 hover:bg-red-50 min-h-[44px]"
          >
            {busy === "rm-avatar" ? <Spinner size="sm" /> : <Trash2 className="h-4 w-4" />}
            Убрать аватар
          </button>
        )}
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          disabled={busy !== null}
          className={`${buttonStyles.secondary} text-xs sm:text-sm min-h-[44px]`}
        >
          {busy === "cover" ? <Spinner size="sm" /> : "Загрузить обои"}
        </button>
        {hasCover && (
          <button
            type="button"
            onClick={() => void remove("cover")}
            disabled={busy !== null}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-red-700 hover:bg-red-50 min-h-[44px]"
          >
            {busy === "rm-cover" ? <Spinner size="sm" /> : <Trash2 className="h-4 w-4" />}
            Убрать обои
          </button>
        )}
      </div>
    </div>
  );
}
