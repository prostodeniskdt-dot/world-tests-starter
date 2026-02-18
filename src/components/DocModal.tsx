"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const TITLES: Record<string, string> = {
  pdn: "Политика обработки персональных данных",
  consent: "Согласие на обработку персональных данных",
  distribution: "Согласие на распространение персональных данных",
  agreement: "Пользовательское соглашение",
  cookies: "Политика использования COOKIES",
  contacts: "Контакты",
};

type DocModalProps = {
  slug: string;
  isOpen: boolean;
  onClose: () => void;
};

export function DocModal({ slug, isOpen, onClose }: DocModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !slug) return;
    setLoading(true);
    setError(null);
    fetch(`/api/docs/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setContent(data.content);
        else setError("Документ не найден");
      })
      .catch(() => setError("Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [isOpen, slug]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 flex-shrink-0">
          <h2 id="doc-modal-title" className="text-lg font-semibold text-zinc-900">
            {TITLES[slug] ?? slug}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-4 flex-1">
          {loading && <p className="text-zinc-500">Загрузка...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {content && (
            <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-700 leading-relaxed">
              {content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
