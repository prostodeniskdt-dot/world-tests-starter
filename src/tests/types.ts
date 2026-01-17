// Базовые типы механик
export type QuestionMechanic =
  | "multiple-choice"
  | "multiple-select"
  | "true-false-enhanced"
  | "cloze-dropdown"
  | "select-errors";

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

// Union тип для всех вопросов
export type PublicTestQuestion =
  | MultipleChoiceQuestion
  | MultipleSelectQuestion
  | TrueFalseEnhancedQuestion
  | ClozeDropdownQuestion
  | SelectErrorsQuestion;

// Типы ответов для разных механик
export type QuestionAnswer =
  | number // multiple-choice
  | number[] // multiple-select, cloze-dropdown (индексы для каждого пропуска), select-errors
  | { answer: boolean; reason: number }; // true-false-enhanced

export type PublicTest = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficultyLevel: 1 | 2 | 3; // Уровень сложности (барные ложки)
  questions: PublicTestQuestion[];
};
