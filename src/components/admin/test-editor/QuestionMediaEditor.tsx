"use client";

import { ImageUpload } from "@/components/ImageUpload";

type QuestionMediaEditorProps = {
  testId: string;
  imageUrl?: string;
  media?: { url?: string; alt?: string; caption?: string };
  onChange: (next: { imageUrl?: string; media?: { type: "image"; url: string; alt?: string; caption?: string } | undefined }) => void;
};

export function QuestionMediaEditor({ testId, imageUrl, media, onChange }: QuestionMediaEditorProps) {
  const url = media?.url ?? imageUrl ?? null;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-700">Изображение к вопросу</label>
      <ImageUpload
        value={url}
        prefix={`tests/${testId}`}
        onChange={(nextUrl) => {
          if (!nextUrl) {
            onChange({ imageUrl: undefined, media: undefined });
            return;
          }
          onChange({
            imageUrl: nextUrl,
            media: { type: "image", url: nextUrl, alt: "", caption: "" },
          });
        }}
      />
      {url && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Alt-текст"
            value={media?.alt ?? ""}
            onChange={(e) =>
              onChange({
                imageUrl: url,
                media: { type: "image", url, alt: e.target.value, caption: media?.caption ?? "" },
              })
            }
            className="border border-zinc-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Подпись (необязательно)"
            value={media?.caption ?? ""}
            onChange={(e) =>
              onChange({
                imageUrl: url,
                media: { type: "image", url, alt: media?.alt ?? "", caption: e.target.value },
              })
            }
            className="border border-zinc-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      )}
    </div>
  );
}
