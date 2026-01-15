"use client";

import Image from "next/image";

interface QuestionImageProps {
  imageUrl: string;
  alt?: string;
}

export function QuestionImage({ imageUrl, alt = "Изображение к вопросу" }: QuestionImageProps) {
  return (
    <div className="my-4 rounded-lg overflow-hidden border border-zinc-200">
      <Image
        src={imageUrl}
        alt={alt}
        width={800}
        height={600}
        className="w-full h-auto"
        unoptimized
      />
    </div>
  );
}
