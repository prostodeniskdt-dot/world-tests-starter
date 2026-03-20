"use client";

import { useState, useRef } from "react";

type ImageUploadProps = {
  value?: string | null;
  onChange: (url: string | null) => void;
  prefix?: string;
  disabled?: boolean;
  className?: string;
};

export function ImageUpload({
  value,
  onChange,
  prefix = "uploads",
  disabled = false,
  className = "",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("prefix", prefix);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Ошибка загрузки");
        return;
      }

      onChange(data.url);
    } catch {
      setError("Ошибка сети");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        disabled={disabled || uploading}
        className="block w-full text-sm text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
      />
      {value && (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Превью"
            className="h-24 w-24 object-cover rounded-lg border border-zinc-200"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold hover:bg-red-600 disabled:opacity-50"
            aria-label="Удалить изображение"
          >
            ×
          </button>
        </div>
      )}
      {uploading && (
        <p className="text-sm text-zinc-500">Загрузка...</p>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
