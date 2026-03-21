"use client";

import { useState } from "react";
import { useLocalUser } from "@/components/UserGate";
import { LoginModal } from "@/components/LoginModal";
import { ImagePlus } from "lucide-react";

export function GlasswareDrinkPhotoForm({
  glasswareId,
}: {
  glasswareId: number;
}) {
  const { user } = useLocalUser();
  const [showAuth, setShowAuth] = useState(false);
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/glassware/upload-image", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.ok && data.url) {
        setImageUrl(data.url);
      } else {
        setMsg(data.error || "Ошибка загрузки");
      }
    } catch {
      setMsg("Ошибка сети");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (!imageUrl) {
      setMsg("Сначала загрузите фото");
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/glassware/drink-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          glassware_id: glasswareId,
          image_url: imageUrl,
          caption: caption.trim() || null,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setMsg(data.error || "Ошибка");
        return;
      }
      setOk(true);
      setCaption("");
      setImageUrl(null);
    } catch {
      setMsg("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  if (ok) {
    return (
      <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        Спасибо! Фото отправлено на модерацию.
      </p>
    );
  }

  return (
    <div>
      {showAuth && (
        <LoginModal isOpen={showAuth} onClose={() => setShowAuth(false)} initialMode="login" />
      )}
      <form onSubmit={submit} className="space-y-3 text-sm">
        {msg ? <p className="text-red-600 text-sm">{msg}</p> : null}
        <div>
          <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer bg-white">
            <ImagePlus className="h-4 w-4" />
            {uploading ? "Загрузка…" : "Выбрать фото"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.target.value = "";
              }}
            />
          </label>
          {imageUrl ? (
            <div className="mt-2 flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="h-16 w-16 rounded object-cover border" />
              <span className="text-zinc-600 text-xs">Готово</span>
            </div>
          ) : null}
        </div>
        <div>
          <label className="block text-zinc-600 mb-1">Подпись (что за напиток, автор)</label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Например: Негрони, бар XYZ"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !imageUrl}
          className="rounded-lg bg-primary-600 text-white px-4 py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? "Отправка…" : "Добавить фото"}
        </button>
      </form>
    </div>
  );
}
