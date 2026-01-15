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
  gaps?: Array<{ index: number; options: string[] }>;
  markedParts?: Array<{ id: number; text: string; start: number; end: number }>;
  step1?: { question: string; options: string[] };
  step2?: { question: string; options: string[] };
  rows?: string[];
  columns?: string[];
  matrixType?: "single-select" | "multiple-select";
}

/**
 * Парсит ключ ответов из формата "1B, 2A, 3(1–B,2–A,3–C,4–D), 4A, 5(D→A→C→B), ..."
 */
function parseAnswerKey(keyText: string): Record<number, any> {
  const answers: Record<number, any> = {};
  
  // Убираем "Ключ (Тест X):" если есть
  keyText = keyText.replace(/^.*?:\s*/, "").trim();
  
  // Разбиваем по запятым, но учитываем скобки
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  
  for (let i = 0; i < keyText.length; i++) {
    const char = keyText[i];
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === "," && depth === 0) {
      if (current.trim()) {
        parts.push(current.trim());
        current = "";
      }
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    parts.push(current.trim());
  }
  
  for (const part of parts) {
    const trimmedPart = part.trim();
    
    // Простой ответ: "1B" или "1A" или " 1A " (с пробелами)
    // Проверяем сначала простые ответы, чтобы не перехватить их другими паттернами
    const simpleMatch = trimmedPart.match(/^(\d+)([A-Z])$/);
    if (simpleMatch) {
      const qNum = parseInt(simpleMatch[1], 10);
      const letter = simpleMatch[2].toUpperCase();
      const answerIndex = letter.charCodeAt(0) - 65; // A=0, B=1, C=2, ...
      answers[qNum] = answerIndex;
      continue;
    }
    
    // Если не простой ответ, проверяем сложные форматы
    if (!trimmedPart.includes("(")) {
      // Если нет скобок и не простой ответ, пропускаем
      continue;
    }
    
    // Matching: "3(1–B,2–A,3–C,4–D)" или "8(1–C,2–B,3–A,4–D)" или "15(1–A,2–B,3–C,4–D)"
    const matchingMatch = trimmedPart.match(/^(\d+)\(([^)]+)\)$/);
    if (matchingMatch) {
      const qNum = parseInt(matchingMatch[1], 10);
      const pairsText = matchingMatch[2];
      // Проверяем, что это matching (содержит пары вида "число–буква" через запятую)
      if (pairsText.match(/^\d+[–-][A-Z](,\s*\d+[–-][A-Z])+$/)) {
        const pairs: [number, number][] = [];
        const pairMatches = pairsText.match(/(\d+)[–-]([A-Z])/g);
        if (pairMatches) {
          for (const pairMatch of pairMatches) {
            const m = pairMatch.match(/(\d+)[–-]([A-Z])/);
            if (m) {
              const leftIdx = parseInt(m[1], 10) - 1; // 1-based to 0-based
              const rightLetter = m[2].toUpperCase();
              const rightIdx = rightLetter.charCodeAt(0) - 65; // A=0, B=1, ...
              pairs.push([leftIdx, rightIdx]);
            }
          }
        }
        answers[qNum] = pairs;
        continue;
      }
    }
    
    // Ordering: "5(D→A→C→B)" или "6(A→B→C→D)"
    const orderingMatch = trimmedPart.match(/^(\d+)\(([^)]+)\)$/);
    if (orderingMatch && orderingMatch[2].includes("→")) {
      const qNum = parseInt(orderingMatch[1], 10);
      const orderText = orderingMatch[2];
      const letters = orderText.split(/[→-]/).map(s => s.trim());
      const order = letters.map(letter => {
        const idx = letter.toUpperCase().charCodeAt(0) - 65;
        return idx;
      });
      answers[qNum] = order;
      continue;
    }
    
    // Multiple select: "2(A,D)" или "5(A,C)" или "16(A,C)"
    const multiSelectMatch = trimmedPart.match(/^(\d+)\(([^)]+)\)$/);
    if (multiSelectMatch && multiSelectMatch[2].match(/^[A-Z](,\s*[A-Z])+$/)) {
      const qNum = parseInt(multiSelectMatch[1], 10);
      const letters = multiSelectMatch[2].split(",").map(s => s.trim());
      const indices = letters.map(letter => letter.toUpperCase().charCodeAt(0) - 65);
      answers[qNum] = indices;
      continue;
    }
    
    // Grouping: "7(A,B / C,D)" или "9(A,B,E / C,D)" или "14(A,B,E / C,D)"
    const groupingMatch = trimmedPart.match(/^(\d+)\(([^)]+)\)$/);
    if (groupingMatch && groupingMatch[2].includes("/")) {
      const qNum = parseInt(groupingMatch[1], 10);
      const groupsText = groupingMatch[2];
      const groups: Record<string, number[]> = {};
      const categoryParts = groupsText.split("/");
      // Это сложнее, нужно знать категории заранее
      // Пока оставляем как массив массивов
      const categoryArrays: number[][] = [];
      for (const catPart of categoryParts) {
        const letters = catPart.split(",").map(s => s.trim());
        const indices = letters.map(letter => letter.toUpperCase().charCodeAt(0) - 65);
        categoryArrays.push(indices);
      }
      answers[qNum] = categoryArrays;
      continue;
    }
    
    // Cloze: "11([1]=A)" или "12([1]=A)" или "15([1]=A)" или "18([1]=A)"
    const clozeMatch = trimmedPart.match(/^(\d+)\(\[(\d+)\]=([A-Z])\)$/);
    if (clozeMatch) {
      const qNum = parseInt(clozeMatch[1], 10);
      const gapIdx = parseInt(clozeMatch[2], 10);
      const letter = clozeMatch[3].toUpperCase();
      const answerIndex = letter.charCodeAt(0) - 65;
      answers[qNum] = { [gapIdx]: answerIndex };
      continue;
    }
    
    // Two-step: "2(Ч1=A;Ч2=A)" или "16(Ч1=A;Ч2=A)"
    // Используем Unicode для кириллицы
    const twoStepMatch = trimmedPart.match(/^(\d+)\([ЧЧ]1=([A-Z]);[ЧЧ]2=([A-Z])\)$/);
    if (twoStepMatch) {
      const qNum = parseInt(twoStepMatch[1], 10);
      const step1Letter = twoStepMatch[2].toUpperCase();
      const step2Letter = twoStepMatch[3].toUpperCase();
      const step1Idx = step1Letter.charCodeAt(0) - 65;
      const step2Idx = step2Letter.charCodeAt(0) - 65;
      answers[qNum] = { step1: step1Idx, step2: step2Idx };
      continue;
    }
    
    // Matrix: "4(1–A;2–B;3–C)" или "17(1–A;2–C;3–B)"
    const matrixMatch = trimmedPart.match(/^(\d+)\(([^)]+)\)$/);
    if (matrixMatch && matrixMatch[2].includes(";") && matrixMatch[2].includes("–")) {
      const qNum = parseInt(matrixMatch[1], 10);
      const pairsText = matrixMatch[2];
      const pairs: Record<number, number> = {};
      const pairMatches = pairsText.split(";");
      for (const pairMatch of pairMatches) {
        const m = pairMatch.match(/(\d+)[–-]([A-Z])/);
        if (m) {
          const rowIdx = parseInt(m[1], 10) - 1; // 1-based to 0-based
          const colLetter = m[2].toUpperCase();
          const colIdx = colLetter.charCodeAt(0) - 65;
          pairs[rowIdx] = colIdx;
        }
      }
      answers[qNum] = pairs;
      continue;
    }
    
    // Matching (если не обработано выше): "8(1–C,2–B,3–A,4–D)" или "15(1–A,2–B,3–C,4–D)" или "19(1–A,2–B,3–C,4–D)"
    const matchingMatch2 = trimmedPart.match(/^(\d+)\(([^)]+)\)$/);
    if (matchingMatch2) {
      const qNum = parseInt(matchingMatch2[1], 10);
      const pairsText = matchingMatch2[2];
      // Проверяем, что это matching (содержит пары вида "число–буква" через запятую, но не через точку с запятой)
      if (pairsText.match(/^\d+[–-][A-Z](,\s*\d+[–-][A-Z])+$/) && !pairsText.includes(";")) {
        const pairs: [number, number][] = [];
        const pairMatches = pairsText.match(/(\d+)[–-]([A-Z])/g);
        if (pairMatches) {
          for (const pairMatch of pairMatches) {
            const m = pairMatch.match(/(\d+)[–-]([A-Z])/);
            if (m) {
              const leftIdx = parseInt(m[1], 10) - 1; // 1-based to 0-based
              const rightLetter = m[2].toUpperCase();
              const rightIdx = rightLetter.charCodeAt(0) - 65; // A=0, B=1, ...
              pairs.push([leftIdx, rightIdx]);
            }
          }
        }
        answers[qNum] = pairs;
        continue;
      }
    }
    
    // Select errors: "11(2,6)"
    const errorsMatch = trimmedPart.match(/^(\d+)\((\d+(?:,\s*\d+)+)\)$/);
    if (errorsMatch) {
      const qNum = parseInt(errorsMatch[1], 10);
      const errorNums = errorsMatch[2].split(",").map(s => parseInt(s.trim(), 10) - 1); // 1-based to 0-based
      answers[qNum] = errorNums;
      continue;
    }
    
    // Исправленная версия: "3(испр.: 4)" -> обрабатываем как "3D" (4-й вариант = индекс 3)
    const correctedMatch = trimmedPart.match(/^(\d+)\([иИ][сС][пП][рР]\.?\s*:\s*(\d+)\)$/);
    if (correctedMatch) {
      const qNum = parseInt(correctedMatch[1], 10);
      const answerNum = parseInt(correctedMatch[2], 10);
      // Если указан номер варианта (1, 2, 3, 4...), конвертируем в индекс (0, 1, 2, 3...)
      const answerIndex = answerNum - 1;
      answers[qNum] = answerIndex;
      continue;
    }
    
    // True/False: "4(Неверно;A)" или "10(Верно;A)" или "11(Верно;A)"
    const tfMatch = trimmedPart.match(/^(\d+)\(([Вв]ерно|[Нн]еверно);([A-Z])\)$/);
    if (tfMatch) {
      const qNum = parseInt(tfMatch[1], 10);
      const isTrue = /верно/i.test(tfMatch[2]);
      const reasonIdx = tfMatch[3].toUpperCase().charCodeAt(0) - 65;
      answers[qNum] = { answer: isTrue, reason: reasonIdx };
      continue;
    }
  }
  
  return answers;
}

/**
 * Извлекает метаданные теста из заголовка
 * Формат: ## ТЕСТ 1 (Простой). **«Пять колонн пузырьков: базовая сборка»**
 */
function parseTestHeader(header: string): { title: string; level: string } | null {
  const match = header.match(/ТЕСТ\s+\d+\s*\(([^)]+)\)[.\s]*\*\*[«"]?([^»"]+)[»"]?\*\*/i);
  if (match) {
    return {
      title: match[2].trim(),
      level: match[1].trim(),
    };
  }
  
  // Альтернативный формат без кавычек
  const match2 = header.match(/ТЕСТ\s+\d+\s*\(([^)]+)\)[.\s]*(.+)/i);
  if (match2) {
    return {
      title: match2[2].trim().replace(/\*\*/g, "").replace(/[«"]/g, "").replace(/[»"]/g, ""),
      level: match2[1].trim(),
    };
  }
  
  return null;
}

/**
 * Парсит вопрос из текста
 */
function parseQuestion(
  questionText: string,
  questionNumber: number,
  answerKey: Record<number, any>,
  hints: Record<number, string>
): ParsedQuestion | null {
  const lines = questionText.split("\n").map((l) => l.trim()).filter((l) => l);
  if (lines.length === 0) return null;
  
  // Находим строку с вопросом (начинается с "**Вопрос X.**" или "**Задание X.**")
  let questionLine = "";
  let questionTextLine = "";
  let mechanic: QuestionMechanic = "multiple-choice";
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^\*\*Вопрос\s+\d+\.\*\*/i) || line.match(/^\*\*Задание\s+\d+/i)) {
      // Извлекаем текст вопроса и механику
      const questionMatch = line.match(/^\*\*(?:Вопрос|Задание)\s+\d+[\.\)].*\*\*\s*(.+)/i) || 
                           line.match(/^\*\*Задание\s+\d+\s*\([^)]+\)\.\*\*\s*(.+)/i);
      if (questionMatch) {
        questionTextLine = questionMatch[1].trim();
        mechanic = detectMechanic(questionTextLine);
      } else {
        // Если не нашли текст в той же строке, берем следующую
        if (i + 1 < lines.length) {
          questionTextLine = lines[i + 1].trim();
          mechanic = detectMechanic(questionTextLine);
        }
      }
      questionLine = line;
      break;
    }
  }
  
  // Если не нашли в первой строке, ищем в следующих
  if (!questionTextLine) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes("?") && !questionTextLine) {
        questionTextLine = line.replace(/^\*\*(?:Вопрос|Задание)\s+\d+[\.\)].*\*\*\s*/i, "").trim();
        mechanic = detectMechanic(line);
        break;
      }
    }
  }
  
  if (!questionTextLine) {
    // Пытаемся взять первую строку
    questionTextLine = lines[0].replace(/^\*\*(?:Вопрос|Задание)\s+\d+[\.\)].*\*\*\s*/i, "").trim();
    mechanic = detectMechanic(lines[0]);
  }
  
  // Убираем механику из текста вопроса
  questionTextLine = questionTextLine.replace(/\*\([^)]+\)\*/g, "").trim();
  
  const question: ParsedQuestion = {
    id: `q${questionNumber}`,
    text: questionTextLine,
    type: mechanic,
    correctAnswer: answerKey[questionNumber] ?? null,
    hint: hints[questionNumber],
  };
  
  // Парсим в зависимости от типа механики
  if (mechanic === "matching") {
    const leftItems: string[] = [];
    const rightItems: string[] = [];
    let inLeft = false;
    let inRight = false;
    
    for (const line of lines) {
      if (/^Слева:/i.test(line)) {
        inLeft = true;
        inRight = false;
        continue;
      }
      if (/^Справа:/i.test(line)) {
        inRight = true;
        inLeft = false;
        continue;
      }
      if (/^Элементы:/i.test(line)) {
        // Для ordering/grouping
        continue;
      }
      
      if (inLeft) {
        const itemMatch = line.match(/^(\d+)\.\s*(.+)$/);
        if (itemMatch) {
          leftItems.push(itemMatch[2].trim());
        } else if (line && !line.match(/^[A-Z]\)/)) {
          leftItems.push(line);
        }
      }
      if (inRight) {
        const itemMatch = line.match(/^([A-Z])\)\s*(.+)$/);
        if (itemMatch) {
          rightItems.push(itemMatch[2].trim());
        } else if (line && !line.match(/^\d+\./)) {
          rightItems.push(line);
        }
      }
    }
    
    if (leftItems.length > 0) question.leftItems = leftItems;
    if (rightItems.length > 0) question.rightItems = rightItems;
  } else if (mechanic === "ordering" || mechanic === "grouping") {
    const items: string[] = [];
    let inItems = false;
    
    for (const line of lines) {
      if (/^Элементы:/i.test(line) || /^Пункты:/i.test(line)) {
        inItems = true;
        continue;
      }
      if (/^Категории:/i.test(line)) {
        inItems = false;
        continue;
      }
      
      if (inItems) {
        const itemMatch = line.match(/^([A-Z])\)\s*(.+)$/);
        if (itemMatch) {
          items.push(itemMatch[2].trim());
        } else if (line && !line.match(/^[A-Z]\)/) && !line.match(/^\d+\./)) {
          items.push(line);
        }
      }
    }
    
    if (items.length > 0) question.items = items;
    
    if (mechanic === "grouping") {
      const categories: string[] = [];
      let inCategories = false;
      
      for (const line of lines) {
        if (/^Категории:/i.test(line)) {
          inCategories = true;
          continue;
        }
        if (inCategories) {
          const catMatch = line.match(/^\*\*([^:]+):\*\*/);
          if (catMatch) {
            categories.push(catMatch[1].trim());
          } else if (line && line.includes(":")) {
            const parts = line.split(":");
            if (parts[0]) categories.push(parts[0].trim());
          }
        }
      }
      
      if (categories.length > 0) question.categories = categories;
    }
  } else if (mechanic === "cloze-dropdown") {
    const gaps: Array<{ index: number; options: string[] }> = [];
    const options: string[] = [];
    let inOptions = false;
    
    // Ищем пропуски вида [1: ___]
    const gapMatch = questionTextLine.match(/\[(\d+):\s*___\]/);
    if (gapMatch) {
      const gapIndex = parseInt(gapMatch[1], 10);
      
      // Ищем варианты для этого пропуска
      for (const line of lines) {
        if (/^Варианты для/i.test(line)) {
          inOptions = true;
          continue;
        }
        if (inOptions) {
          const optMatch = line.match(/^([A-Z])\)\s*(.+)$/);
          if (optMatch) {
            options.push(optMatch[2].trim());
          }
        }
      }
      
      if (options.length > 0) {
        gaps.push({ index: gapIndex, options });
      }
    }
    
    if (gaps.length > 0) question.gaps = gaps;
  } else if (mechanic === "multiple-select" || mechanic === "multiple-choice" || mechanic === "best-example" || mechanic === "scenario") {
    const options: string[] = [];
    
    for (const line of lines) {
      const optMatch = line.match(/^([A-Z])\)\s*(.+)$/);
      if (optMatch) {
        options.push(optMatch[2].trim());
      }
    }
    
    if (options.length > 0) question.options = options;
  } else if (mechanic === "true-false-enhanced") {
    const reasons: string[] = [];
    let inReasons = false;
    
    for (const line of lines) {
      if (/^Выберите причину:/i.test(line) || /^2\.\s*Выберите причину:/i.test(line)) {
        inReasons = true;
        continue;
      }
      if (inReasons) {
        const reasonMatch = line.match(/^([A-Z])\)\s*(.+)$/);
        if (reasonMatch) {
          reasons.push(reasonMatch[2].trim());
        }
      }
    }
    
    if (reasons.length > 0) question.options = reasons;
  } else if (mechanic === "two-step") {
    const step1Options: string[] = [];
    const step2Options: string[] = [];
    let inStep1 = false;
    let inStep2 = false;
    
    for (const line of lines) {
      if (/^Задание\s+\d+\s*\(Часть\s+1\)/i.test(line) || /^Часть\s+1/i.test(line)) {
        inStep1 = true;
        inStep2 = false;
        continue;
      }
      if (/^Задание\s+\d+\s*\(Часть\s+2\)/i.test(line) || /^Часть\s+2/i.test(line)) {
        inStep2 = true;
        inStep1 = false;
        continue;
      }
      
      if (inStep1) {
        const optMatch = line.match(/^([A-Z])\)\s*(.+)$/);
        if (optMatch) {
          step1Options.push(optMatch[2].trim());
        }
      }
      if (inStep2) {
        const optMatch = line.match(/^([A-Z])\)\s*(.+)$/);
        if (optMatch) {
          step2Options.push(optMatch[2].trim());
        }
      }
    }
    
    if (step1Options.length > 0) {
      question.step1 = { question: questionTextLine, options: step1Options };
    }
    if (step2Options.length > 0) {
      question.step2 = { question: "Выберите объяснение", options: step2Options };
    }
  } else if (mechanic === "matrix") {
    const rows: string[] = [];
    const columns: string[] = [];
    let inObjects = false;
    let inCharacteristics = false;
    
    for (const line of lines) {
      if (/^Объекты:/i.test(line)) {
        inObjects = true;
        inCharacteristics = false;
        continue;
      }
      if (/^Характеристики:/i.test(line)) {
        inCharacteristics = true;
        inObjects = false;
        continue;
      }
      
      if (inObjects) {
        const objMatch = line.match(/^(\d+)\.\s*(.+)$/);
        if (objMatch) {
          rows.push(objMatch[2].trim());
        }
      }
      if (inCharacteristics) {
        const charMatch = line.match(/^([A-Z])\)\s*(.+)$/);
        if (charMatch) {
          columns.push(charMatch[2].trim());
        }
      }
    }
    
    if (rows.length > 0) question.rows = rows;
    if (columns.length > 0) question.columns = columns;
    question.matrixType = "single-select";
  } else if (mechanic === "select-errors") {
    // Для select-errors нужно парсить пронумерованные строки
    const markedParts: Array<{ id: number; text: string; start: number; end: number }> = [];
    let partId = 1;
    
    for (const line of lines) {
      if (/^Текст:/i.test(line)) continue;
      const textMatch = line.match(/^\[(\d+)\]\s*(.+)$/);
      if (textMatch) {
        const text = textMatch[2].trim();
        markedParts.push({
          id: partId++,
          text,
          start: 0,
          end: text.length,
        });
      }
    }
    
    if (markedParts.length > 0) question.markedParts = markedParts;
  }
  
  return question;
}

/**
 * Извлекает пояснения из текста
 */
function parseHints(text: string): Record<number, string> {
  const hints: Record<number, string> = {};
  const lines = text.split("\n");
  let currentQuestionNum = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Ищем "**Пояснение:**" после вопроса
    if (/^\*\*Пояснение:\*\*/i.test(line)) {
      const hintText = line.replace(/^\*\*Пояснение:\*\*\s*/i, "").trim();
      if (hintText && currentQuestionNum > 0) {
        hints[currentQuestionNum] = hintText;
      }
    } else if (/^Пояснение:/i.test(line)) {
      const hintText = line.replace(/^Пояснение:\s*/i, "").trim();
      if (hintText && currentQuestionNum > 0) {
        hints[currentQuestionNum] = hintText;
      }
    } else if (/^\*\*Вопрос\s+(\d+)\.\*\*/i.test(line) || /^\*\*Задание\s+(\d+)/i.test(line)) {
      const match = line.match(/^\*\*Вопрос\s+(\d+)\.\*\*/i) || line.match(/^\*\*Задание\s+(\d+)/i);
      if (match) {
        currentQuestionNum = parseInt(match[1], 10);
      }
    }
    
    // Продолжение пояснения на следующей строке
    if (currentQuestionNum > 0 && hints[currentQuestionNum] && line && !line.match(/^\*\*Вопрос/i) && !line.match(/^[A-Z]\)/) && !line.match(/^\d+\./)) {
      if (!line.match(/^Пояснение:/i) && !line.match(/^Ключ/i) && !line.match(/^---/)) {
        hints[currentQuestionNum] += " " + line;
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
  
  // Разделяем на тесты по заголовкам "## ТЕСТ X"
  const testSections = content.split(/(?=##\s+ТЕСТ\s+\d+)/i);
  
  for (const section of testSections) {
    if (!section.trim()) continue;
    
    const lines = section.split("\n");
    let currentLine = 0;
    
    // Парсим заголовок
    let headerLine = "";
    while (currentLine < lines.length && !headerLine) {
      if (/^##\s+ТЕСТ\s+\d+/i.test(lines[currentLine])) {
        headerLine = lines[currentLine];
        break;
      }
      currentLine++;
    }
    
    if (!headerLine) continue;
    
    const metadata = parseTestHeader(headerLine);
    if (!metadata) continue;
    
    currentLine++;
    
    // Ищем ключ ответов
    let answerKeyText = "";
    let answerKey: Record<number, any> = {};
    let keyLineIndex = -1;
    
    for (let i = currentLine; i < lines.length; i++) {
      if (/^\*\*Ключ/i.test(lines[i])) {
        // Ключ может быть на нескольких строках
        // Убираем "**Ключ (Тест X):**" и берем остальное
        answerKeyText = lines[i].replace(/^\*\*Ключ[^:]*:\s*\*\*/i, "").trim();
        let j = i + 1;
        // Продолжаем читать до пустой строки или следующего раздела
        while (j < lines.length) {
          const nextLine = lines[j].trim();
          if (!nextLine || nextLine.match(/^---/)) {
            break;
          }
          // Если следующая строка не начинается с "**", добавляем к ключу
          if (!nextLine.match(/^\*\*/)) {
            answerKeyText += " " + nextLine;
          } else {
            break;
          }
          j++;
        }
        answerKey = parseAnswerKey(answerKeyText);
        keyLineIndex = i;
        break;
      }
    }
    
    // Извлекаем пояснения
    const hints = parseHints(section);
    
    // Парсим вопросы (до ключа)
    const questions: ParsedQuestion[] = [];
    const questionTexts: string[] = [];
    let currentQuestion = "";
    let questionStarted = false;
    
    const endLine = keyLineIndex > 0 ? keyLineIndex : lines.length;
    
    for (let i = currentLine; i < endLine; i++) {
      const line = lines[i].trim();
      
      // Начало нового вопроса
      if (/^\*\*Вопрос\s+\d+\.\*\*/i.test(line) || /^\*\*Задание\s+\d+/i.test(line)) {
        if (currentQuestion && questionStarted) {
          questionTexts.push(currentQuestion);
        }
        currentQuestion = line + "\n";
        questionStarted = true;
        continue;
      }
      
      // Продолжение вопроса
      if (questionStarted) {
        // Конец вопроса - разделитель "---"
        if (/^---/.test(line)) {
          if (currentQuestion) {
            questionTexts.push(currentQuestion);
            currentQuestion = "";
            questionStarted = false;
          }
          continue;
        }
        
        currentQuestion += line + "\n";
      }
    }
    
    if (currentQuestion && questionStarted) {
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
      // Генерируем ID на основе уровня сложности и номера
      const levelMap: Record<string, string> = {
        "простой": "base",
        "средний": "practice",
        "сложный": "advanced",
      };
      const levelKey = levelMap[metadata.level.toLowerCase()] || "base";
      const testNum = tests.length + 1;
      const testId = `cocktail-${levelKey}-${testNum}`;
      
      tests.push({
        id: testId,
        title: metadata.title,
        level: metadata.level,
        instruction: undefined,
        questions,
      });
    }
  }
  
  return tests;
}
