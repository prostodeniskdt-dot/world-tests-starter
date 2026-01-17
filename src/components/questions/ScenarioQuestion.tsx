"use client";

import type { ScenarioQuestion as ScenarioQuestionType, QuestionAnswer } from "@/tests/types";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { OrderingQuestion } from "./OrderingQuestion";
import { MatchingQuestion } from "./MatchingQuestion";

interface ScenarioQuestionProps {
  question: ScenarioQuestionType;
  answer: QuestionAnswer | null;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

export function ScenarioQuestion({
  question,
  answer,
  onChange,
  disabled = false,
}: ScenarioQuestionProps) {
  // В зависимости от actionType используем соответствующий компонент
  if (question.actionType === "select") {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
          <p className="text-base sm:text-lg font-medium text-zinc-900">{question.situation}</p>
        </div>
        <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 mb-4">
          <p className="text-sm sm:text-base text-zinc-700">{question.question}</p>
        </div>
        <MultipleChoiceQuestion
          question={{
            ...question,
            type: "multiple-choice",
            options: question.actions,
          }}
          answer={answer}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
    );
  }

  if (question.actionType === "order") {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
          <p className="text-base sm:text-lg font-medium text-zinc-900">{question.situation}</p>
        </div>
        <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 mb-4">
          <p className="text-sm sm:text-base text-zinc-700">{question.question}</p>
        </div>
        <OrderingQuestion
          question={{
            ...question,
            type: "ordering",
            items: question.actions,
            correctOrder: question.actions.map((_, i) => i),
            instruction: "Расставьте действия в правильном порядке",
          }}
          answer={answer}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
    );
  }

  // match
  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
        <p className="text-base sm:text-lg font-medium text-zinc-900">{question.situation}</p>
      </div>
      <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 mb-4">
        <p className="text-sm sm:text-base text-zinc-700">{question.question}</p>
      </div>
      <MatchingQuestion
        question={{
          ...question,
          type: "matching",
          leftItems: question.actions.slice(0, Math.ceil(question.actions.length / 2)),
          rightItems: question.actions.slice(Math.ceil(question.actions.length / 2)),
          correctPairs: [],
          variant: "1-to-1",
        }}
        answer={answer}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}
