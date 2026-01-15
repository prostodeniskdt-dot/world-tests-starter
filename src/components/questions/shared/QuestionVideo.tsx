"use client";

interface QuestionVideoProps {
  videoUrl: string;
}

export function QuestionVideo({ videoUrl }: QuestionVideoProps) {
  return (
    <div className="my-4 rounded-lg overflow-hidden border border-zinc-200">
      <video
        src={videoUrl}
        controls
        className="w-full h-auto"
        style={{ maxHeight: "500px" }}
      >
        Ваш браузер не поддерживает видео.
      </video>
    </div>
  );
}
