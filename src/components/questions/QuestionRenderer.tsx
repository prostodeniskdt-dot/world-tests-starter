"use client";

import type { PublicTestQuestion, QuestionAnswer } from "@/tests/types";
import { QuestionHint } from "./shared/QuestionHint";
import { QuestionImage } from "./shared/QuestionImage";
import { QuestionVideo } from "./shared/QuestionVideo";
import { resolveQuestionMedia } from "@/lib/test-import/normalize";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { MultipleSelectQuestion } from "./MultipleSelectQuestion";
import { TrueFalseEnhancedQuestion } from "./TrueFalseEnhancedQuestion";
import { ClozeDropdownQuestion } from "./ClozeDropdownQuestion";
import { SelectErrorsQuestion } from "./SelectErrorsQuestion";
import { MatchingQuestion } from "./MatchingQuestion";
import { OrderingQuestion } from "./OrderingQuestion";
import { TwoStepQuestion } from "./TwoStepQuestion";
import { MatrixQuestion } from "./MatrixQuestion";
import { SUPPORTED_QUESTION_TYPES } from "@/lib/test-schema";

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
    showHint,
  };

  const imageUrl = resolveQuestionMedia(question as Parameters<typeof resolveQuestionMedia>[0]);

  return (
    <div className="space-y-4">
      {imageUrl && (
        <QuestionImage
          imageUrl={imageUrl}
          alt={(question as { media?: { alt?: string } }).media?.alt}
          caption={(question as { media?: { caption?: string } }).media?.caption}
        />
      )}

      {question.videoUrl && <QuestionVideo videoUrl={question.videoUrl} />}

      {/* Рендеринг вопроса по типу */}
      {question.type === "multiple-choice" && (
        <MultipleChoiceQuestion {...commonProps} question={question as import("@/tests/types").MultipleChoiceQuestion} />
      )}
      {question.type === "multiple-select" && (
        <MultipleSelectQuestion {...commonProps} question={question as import("@/tests/types").MultipleSelectQuestion} />
      )}
      {question.type === "true-false-enhanced" && (
        <TrueFalseEnhancedQuestion {...commonProps} question={question as import("@/tests/types").TrueFalseEnhancedQuestion} showHint={showHint} isCorrect={isCorrect} />
      )}
      {question.type === "cloze-dropdown" && (
        <ClozeDropdownQuestion {...commonProps} question={question as import("@/tests/types").ClozeDropdownQuestion} />
      )}
      {question.type === "select-errors" && (
        <SelectErrorsQuestion {...commonProps} question={question as import("@/tests/types").SelectErrorsQuestion} />
      )}
      {question.type === "matching" && (
        <MatchingQuestion {...commonProps} question={question as import("@/tests/types").MatchingQuestion} />
      )}
      {question.type === "ordering" && (
        <OrderingQuestion {...commonProps} question={question as import("@/tests/types").OrderingQuestion} />
      )}
      {question.type === "two-step" && (
        <TwoStepQuestion {...commonProps} question={question as import("@/tests/types").TwoStepQuestion} />
      )}
      {question.type === "matrix" && (
        <MatrixQuestion {...commonProps} question={question as import("@/tests/types").MatrixQuestion} />
      )}

      {!(SUPPORTED_QUESTION_TYPES as readonly string[]).includes(question.type) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Вопрос недоступен для прохождения</p>
          <p className="mt-1 text-amber-800">
            Механика «{question.type}» не поддерживается. Обратитесь к администратору — тест будет обновлён.
          </p>
          {question.text && <p className="mt-2 text-zinc-700">{question.text}</p>}
        </div>
      )}

      {/* Подсказка */}
      {showHint && question.hint && (
        <QuestionHint hint={question.hint} isCorrect={isCorrect} />
      )}
    </div>
  );
}
