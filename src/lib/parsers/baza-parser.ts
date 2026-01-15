import { detectMechanic } from "./mechanic-detector";
import type { QuestionMechanic } from "@/tests/types";

export interface ParsedTest {
  id: string;
  title: string;
  level: string;
  instruction?: string;
  questions: ParsedQuestion[];
}

export interface ParsedQuestion {
  id: string;
  text: string;
  type: QuestionMechanic;
  options?: string[];
  correctAnswer: any; // Зависит от типа механики
  hint?: string;
  // Дополнительные поля для разных механик
  leftItems?: string[];
  rightItems?: string[];
  items?: string[];
  categories?: string[];
  // и т.д.
}

/**
 * Парсит ключ ответов вида "1C, 2A, 3D, ..."
 */
function parseAnswerKey(keyText: string): Record<number, number> {
  const answers: Record<number, number> = {};
  const matches = keyText.match(/(\d+)([A-Z])/gi);
  
  if (!matches) return answers;
  
  for (const match of matches) {
    const numMatch = match.match(/(\d+)([A-Z])/i);
    if (numMatch) {
      const questionNum = parseInt(numMatch[1], 10);
      const letter = numMatch[2].toUpperCase();
      const answerIndex = letter.charCodeAt(0) - 65; // A=0, B=1, C=2, ...
      answers[questionNum] = answerIndex;
    }
  }
  
  return answers;
}

/**
 * Извлекает метаданные теста из заголовка
 */
function parseTestHeader(header: string): { title: string; level: string } | null {
  const match = header.match(/ТЕСТ\s+\d+:\s*(.+?)\s*\|\s*Уровень:\s*(.+)/i);
  if (!match) return null;
  
  return {
    title: match[1].trim(),
    level: match[2].trim(),
  };
}

/**
 * Парсит вопрос с вариантами ответов
 */
function parseQuestion(
  questionText: string,
  questionNumber: number,
  answerKey: Record<number, number>,
  hints: Record<number, string>
): ParsedQuestion | null {
  const lines = questionText.split("\n").map((l) => l.trim()).filter((l) => l);
  if (lines.length === 0) return null;
  
  // Первая строка - текст вопроса
  const questionTextLine = lines[0];
  if (!questionTextLine) return null;
  
  // Определяем механику
  const mechanic = detectMechanic(questionTextLine);
  
  // Парсим варианты ответов (A), B), C), D), ...)
  const options: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const optionMatch = line.match(/^([A-Z])\)\s*(.+)$/);
    if (optionMatch) {
      options.push(optionMatch[2].trim());
    }
  }
  
  // Получаем правильный ответ из ключа
  const correctAnswerIndex = answerKey[questionNumber];
  const correctAnswer = correctAnswerIndex !== undefined ? correctAnswerIndex : null;
  
  // Получаем подсказку
  const hint = hints[questionNumber];
  
  return {
    id: `q${questionNumber}`,
    text: questionTextLine,
    type: mechanic,
    options: options.length > 0 ? options : undefined,
    correctAnswer,
    hint,
  };
}

/**
 * Извлекает пояснения из текста
 */
function parseHints(text: string, answerKey: Record<number, number>): Record<number, string> {
  const hints: Record<number, string> = {};
  
  // Ищем секцию "Пояснения:" или просто пояснения после "Ответ X —"
  const lines = text.split("\n");
  let inHintsSection = false;
  let currentQuestionNum = 1;
  
  for (const line of lines) {
    if (/пояснения?:/i.test(line)) {
      inHintsSection = true;
      continue;
    }
    
    if (inHintsSection) {
      // Ищем паттерн "Ответ X —" или "Ответ X:" где X - буква ответа
      const answerMatch = line.match(/ответ\s+([A-Z])\s*[—:]\s*(.+)/i);
      if (answerMatch) {
        const letter = answerMatch[1].toUpperCase();
        const hintText = answerMatch[2].trim();
        
        // Находим номер вопроса по букве ответа из ключа
        for (const [qNum, answerIndex] of Object.entries(answerKey)) {
          const answerLetter = String.fromCharCode(65 + answerIndex); // A=0, B=1, C=2, ...
          if (answerLetter === letter) {
            hints[parseInt(qNum, 10)] = hintText;
            break;
          }
        }
      } else if (line.trim()) {
        // Продолжение предыдущего пояснения
        const lastKey = Math.max(...Object.keys(hints).map(Number));
        if (lastKey > 0 && hints[lastKey]) {
          hints[lastKey] += " " + line.trim();
        }
      }
    }
  }
  
  return hints;
}

/**
 * Основная функция парсинга файла baza.txt
 */
export function parseBazaFile(content: string): ParsedTest[] {
  const tests: ParsedTest[] = [];
  
  // Разделяем на тесты по заголовкам "ТЕСТ X:"
  const testSections = content.split(/(?=ТЕСТ\s+\d+:)/i);
  
  for (const section of testSections) {
    if (!section.trim()) continue;
    
    const lines = section.split("\n");
    let currentLine = 0;
    
    // Парсим заголовок
    const headerLine = lines[currentLine];
    if (!headerLine || !/ТЕСТ\s+\d+:/i.test(headerLine)) continue;
    
    const metadata = parseTestHeader(headerLine);
    if (!metadata) continue;
    
    currentLine++;
    
    // Парсим инструкцию (если есть)
    let instruction: string | undefined;
    if (lines[currentLine] && /инструкция:/i.test(lines[currentLine])) {
      instruction = lines[currentLine].replace(/инструкция:\s*/i, "").trim();
      currentLine++;
    }
    
    // Пропускаем пустые строки
    while (currentLine < lines.length && !lines[currentLine].trim()) {
      currentLine++;
    }
    
    // Ищем ключ ответов
    let answerKeyText = "";
    let answerKey: Record<number, number> = {};
    let keyLineIndex = -1;
    
    for (let i = currentLine; i < lines.length; i++) {
      if (/ключ:\s*/i.test(lines[i])) {
        answerKeyText = lines[i].replace(/ключ:\s*/i, "").trim();
        answerKey = parseAnswerKey(answerKeyText);
        keyLineIndex = i;
        break;
      }
    }
    
    // Извлекаем пояснения (после получения ключа)
    const hints = parseHints(section, answerKey);
    
    // Парсим вопросы (до ключа)
    const questions: ParsedQuestion[] = [];
    const questionTexts: string[] = [];
    let currentQuestion = "";
    
    const endLine = keyLineIndex > 0 ? keyLineIndex : lines.length;
    
    for (let i = currentLine; i < endLine; i++) {
      const line = lines[i].trim();
      
      // Если строка начинается с цифры или является вопросом (не вариант ответа)
      if (line && !/^[A-Z]\)/.test(line) && !/^Ключ:/i.test(line)) {
        // Если это новый вопрос (содержит "?" или длинная строка без вариантов)
        if (line.includes("?") || (line.length > 50 && !currentQuestion)) {
          if (currentQuestion) {
            questionTexts.push(currentQuestion);
          }
          currentQuestion = line + "\n";
        } else if (currentQuestion) {
          currentQuestion += line + "\n";
        }
      } else if (/^[A-Z]\)/.test(line) && currentQuestion) {
        // Вариант ответа
        currentQuestion += line + "\n";
      } else if (!line && currentQuestion) {
        // Пустая строка - конец вопроса
        questionTexts.push(currentQuestion);
        currentQuestion = "";
      }
    }
    
    if (currentQuestion) {
      questionTexts.push(currentQuestion);
    }
    
    // Парсим каждый вопрос
    let questionNumber = 1;
    for (const questionText of questionTexts) {
      const question = parseQuestion(questionText, questionNumber, answerKey, hints);
      if (question) {
        questions.push(question);
        questionNumber++;
      }
    }
    
    // Создаем тест
    if (questions.length > 0) {
      const testId = `test-${tests.length + 1}`;
      tests.push({
        id: testId,
        title: metadata.title,
        level: metadata.level,
        instruction,
        questions,
      });
    }
  }
  
  return tests;
}
