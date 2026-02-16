// Базовые типы механик
export type QuestionMechanic =
  | "multiple-choice"
  | "multiple-select"
  | "true-false-enhanced"
  | "cloze-dropdown"
  | "select-errors"
  | "matching"
  | "ordering"
  | "grouping"
  | "two-step"
  | "matrix"
  | "best-example"
  | "scenario"
  | "construct";

// Базовый интерфейс для всех вопросов
export interface BaseQuestion {
  id: string;
  text: string;
  hint?: string; // Справка для показа после ответа
  imageUrl?: string; // Путь к изображению в папке media/
  videoUrl?: string; // Путь к видео в папке media/
}

// Multiple Choice (существующий тип)
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple-choice";
  options: string[];
}

// Multiple Select
export interface MultipleSelectQuestion extends BaseQuestion {
  type: "multiple-select";
  options: string[];
  instruction?: string; // "Выберите все верные (может быть несколько)"
}

// True/False Enhanced
export interface TrueFalseEnhancedQuestion extends BaseQuestion {
  type: "true-false-enhanced";
  statement: string;
  reasons: string[]; // Варианты причин
}

// Cloze Dropdown
export interface ClozeDropdownQuestion extends BaseQuestion {
  type: "cloze-dropdown";
  text: string; // Текст с пропусками вида "___" или "{0}"
  gaps: Array<{
    index: number; // Позиция пропуска
    options: string[]; // Варианты для dropdown
  }>;
  extraOptions?: string[]; // Лишние варианты
}

// Select Errors
export interface SelectErrorsQuestion extends BaseQuestion {
  type: "select-errors";
  content: string; // Текст/формула/код
  markedParts: Array<{
    id: number;
    text: string;
    start: number;
    end: number;
  }>;
  allowMultiple: boolean; // Можно выбрать несколько или одно
}

// Matching
export interface MatchingQuestion extends BaseQuestion {
  type: "matching";
  leftItems: string[];
  rightItems: string[];
  correctPairs?: [number, number][];
  variant?: "1-to-1";
}

// Ordering
export interface OrderingQuestion extends BaseQuestion {
  type: "ordering";
  items: string[];
  correctOrder?: number[];
  instruction?: string;
}

// Grouping
export interface GroupingQuestion extends BaseQuestion {
  type: "grouping";
  items: string[];
  categories: string[];
}

// Two-step
export interface TwoStepQuestion extends BaseQuestion {
  type: "two-step";
  step1: {
    question: string;
    options: string[];
  };
  step2: {
    question: string;
    options: string[];
  };
}

// Matrix
export interface MatrixQuestion extends BaseQuestion {
  type: "matrix";
  rows: string[];
  columns: string[];
  matrixType: "single-select" | "multiple-select";
}

// Best Example
export interface BestExampleQuestion extends BaseQuestion {
  type: "best-example";
  options: string[];
}

// Scenario
export interface ScenarioQuestion extends BaseQuestion {
  type: "scenario";
  situation: string;
  question: string;
  actionType: "select" | "order" | "match";
  actions: string[];
}

// Construct
export interface ConstructQuestion extends BaseQuestion {
  type: "construct";
  blocks: string[];
  question: "blocks" | "order" | "both";
}

// Union тип для всех вопросов
export type PublicTestQuestion =
  | MultipleChoiceQuestion
  | MultipleSelectQuestion
  | TrueFalseEnhancedQuestion
  | ClozeDropdownQuestion
  | SelectErrorsQuestion
  | MatchingQuestion
  | OrderingQuestion
  | GroupingQuestion
  | TwoStepQuestion
  | MatrixQuestion
  | BestExampleQuestion
  | ScenarioQuestion
  | ConstructQuestion;

// Типы ответов для разных механик
export type QuestionAnswer =
  | number // multiple-choice, best-example
  | number[] // multiple-select, ordering, cloze-dropdown (индексы для каждого пропуска), select-errors
  | [number, number][] // matching, scenario (matching mode)
  | Record<string, number[]> // grouping
  | { answer: boolean; reason: number } // true-false-enhanced
  | { step1: number; step2: number } // two-step
  | Record<number, number> // matrix single-select
  | Record<number, number[]> // matrix multiple-select
  | { blocks: number[]; order: number[] } // construct
  | null; // для опциональных значений

export type PublicTest = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficultyLevel: 1 | 2 | 3; // Уровень сложности (барные ложки)
  /** Имя автора теста (по умолчанию показывается «Денис Колодешников») */
  author?: string;
  questions: PublicTestQuestion[];
};
