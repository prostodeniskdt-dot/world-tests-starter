"use client";

interface QuestionHintProps {
  hint: string;
  isCorrect?: boolean;
}

export function QuestionHint({ hint, isCorrect }: QuestionHintProps) {
  return (
    <div
      className={`mt-2 p-3 rounded-lg border-2 ${
        isCorrect !== undefined
          ? isCorrect
            ? "bg-green-50 border-green-300 text-green-800"
            : "bg-red-50 border-red-300 text-red-800"
          : "bg-blue-50 border-blue-300 text-blue-800"
      }`}
    >
      <strong>Справка:</strong> {hint}
    </div>
  );
}
