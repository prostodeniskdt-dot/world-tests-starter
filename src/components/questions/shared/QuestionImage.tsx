"use client";

interface QuestionImageProps {
  imageUrl: string;
  alt?: string;
  caption?: string;
}

export function QuestionImage({ imageUrl, alt = "Изображение к вопросу", caption }: QuestionImageProps) {
  return (
    <figure className="my-4 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={alt}
        className="w-full h-auto max-h-[480px] object-contain mx-auto"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
      {caption && (
        <figcaption className="text-xs text-zinc-500 px-3 py-2 border-t border-zinc-200">{caption}</figcaption>
      )}
    </figure>
  );
}
