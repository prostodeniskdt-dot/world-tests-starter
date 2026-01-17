"use client";

import type { PublicTestQuestion, QuestionAnswer } from "@/tests/types";
import { QuestionHint } from "./shared/QuestionHint";
import { QuestionImage } from "./shared/QuestionImage";
import { QuestionVideo } from "./shared/QuestionVideo";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { MultipleSelectQuestion } from "./MultipleSelectQuestion";
import { TrueFalseEnhancedQuestion } from "./TrueFalseEnhancedQuestion";
import { ClozeDropdownQuestion } from "./ClozeDropdownQuestion";
import { SelectErrorsQuestion } from "./SelectErrorsQuestion";

interface QuestionRendererProps {
  question: PublicTestQuestion;
  answer: QuestionAnswer | null;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
  showHint?: boolean;
  isCorrect?: boolean;
}

export function QuestionRenderer({
  question,
  answer,
  onChange,
  disabled = false,
  showHint = false,
  isCorrect,
}: QuestionRendererProps) {
  const commonProps = {
    question,
    answer,
    onChange,
    disabled,
  };

  return (
    <div className="space-y-4">
      {/* Изображение */}
      {question.imageUrl && <QuestionImage imageUrl={question.imageUrl} />}

      {/* Видео */}
      {question.videoUrl && <QuestionVideo videoUrl={question.videoUrl} />}

      {/* Рендеринг вопроса по типу */}
      {question.type === "multiple-choice" && (
        <MultipleChoiceQuestion {...commonProps} question={question as import("@/tests/types").MultipleChoiceQuestion} />
      )}
      {question.type === "multiple-select" && (
        <MultipleSelectQuestion {...commonProps} question={question as import("@/tests/types").MultipleSelectQuestion} />
      )}
      {question.type === "true-false-enhanced" && (
        <TrueFalseEnhancedQuestion {...commonProps} question={question as import("@/tests/types").TrueFalseEnhancedQuestion} />
      )}
      {question.type === "cloze-dropdown" && (
        <ClozeDropdownQuestion {...commonProps} question={question as import("@/tests/types").ClozeDropdownQuestion} />
      )}
      {question.type === "select-errors" && (
        <SelectErrorsQuestion {...commonProps} question={question as import("@/tests/types").SelectErrorsQuestion} />
      )}

      {/* Подсказка */}
      {showHint && question.hint && (
        <QuestionHint hint={question.hint} isCorrect={isCorrect} />
      )}
    </div>
  );
}
