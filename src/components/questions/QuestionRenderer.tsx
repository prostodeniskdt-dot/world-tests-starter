"use client";

import type { PublicTestQuestion, QuestionAnswer } from "@/tests/types";
import { QuestionHint } from "./shared/QuestionHint";
import { QuestionImage } from "./shared/QuestionImage";
import { QuestionVideo } from "./shared/QuestionVideo";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { MultipleSelectQuestion } from "./MultipleSelectQuestion";
import { MatchingQuestion } from "./MatchingQuestion";
import { OrderingQuestion } from "./OrderingQuestion";
import { GroupingQuestion } from "./GroupingQuestion";
import { TrueFalseEnhancedQuestion } from "./TrueFalseEnhancedQuestion";
import { ClozeDropdownQuestion } from "./ClozeDropdownQuestion";
import { SelectErrorsQuestion } from "./SelectErrorsQuestion";
import { TwoStepQuestion } from "./TwoStepQuestion";
import { MatrixQuestion } from "./MatrixQuestion";
import { BestExampleQuestion } from "./BestExampleQuestion";
import { ScenarioQuestion } from "./ScenarioQuestion";
import { ConstructQuestion } from "./ConstructQuestion";

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
      {question.type === "multiple-choice" && <MultipleChoiceQuestion {...commonProps} />}
      {question.type === "multiple-select" && <MultipleSelectQuestion {...commonProps} />}
      {question.type === "matching" && <MatchingQuestion {...commonProps} />}
      {question.type === "ordering" && <OrderingQuestion {...commonProps} />}
      {question.type === "grouping" && <GroupingQuestion {...commonProps} />}
      {question.type === "true-false-enhanced" && <TrueFalseEnhancedQuestion {...commonProps} />}
      {question.type === "cloze-dropdown" && <ClozeDropdownQuestion {...commonProps} />}
      {question.type === "select-errors" && <SelectErrorsQuestion {...commonProps} />}
      {question.type === "two-step" && <TwoStepQuestion {...commonProps} />}
      {question.type === "matrix" && <MatrixQuestion {...commonProps} />}
      {question.type === "best-example" && <BestExampleQuestion {...commonProps} />}
      {question.type === "scenario" && <ScenarioQuestion {...commonProps} />}
      {question.type === "construct" && <ConstructQuestion {...commonProps} />}

      {/* Подсказка */}
      {showHint && question.hint && (
        <QuestionHint hint={question.hint} isCorrect={isCorrect} />
      )}
    </div>
  );
}
