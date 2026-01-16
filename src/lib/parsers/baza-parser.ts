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
 * Парсит ключ ответов из формата "1A, 2(1B2D3A4C), 3(B→D→A→C), ..."
 */
function parseAnswerKey(keyText: string): Record<number, any> {
  const answers: Record<number, any> = {};
  
  // Убираем "Ключ (Тест X):" если есть
  keyText = keyText.replace(/^.*?:\s*/, "").trim();
  
  // Разбиваем по запятым, но учитываем скобки и multiple-select формат
  // Формат: "1A, 2(1B2D3A4C), 3(B→D→A→C), 8A,C, ..."
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  
  for (let i = 0; i < keyText.length; i++) {
    const char = keyText[i];
    if (char === "(") depth++;
    if (char === ")") depth--;
    // Разделяем по "," если глубина скобок = 0
    // НО не разбиваем, если это multiple-select формат (цифра + буквы через запятую)
    if (char === "," && depth === 0) {
      // Проверяем, не является ли это multiple-select форматом
      // Если текущая часть заканчивается буквой и следующий символ - буква, это multiple-select
      const nextChar = i + 1 < keyText.length ? keyText[i + 1].trim() : "";
      const currentEndsWithLetter = /[A-Z]$/.test(current.trim());
      const nextIsLetter = /^[A-Z]/.test(nextChar);
      
      if (currentEndsWithLetter && nextIsLetter) {
        // Это multiple-select, не разбиваем
        current += char;
      } else {
        // Обычная запятая, разбиваем
        if (current.trim()) {
          parts.push(current.trim());
          current = "";
        }
      }
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    parts.push(current.trim());
  }
  
  for (const part of parts) {
    let trimmedPart = part.trim();
    // Убираем завершающую точку если есть
    trimmedPart = trimmedPart.replace(/\.$/, "");
    
    // Multiple select без скобок: "8A,C" или "2A,D,F" (проверяем ПЕРЕД простым ответом)
    const multiSelectNoBrackets = trimmedPart.match(/^(\d+)([A-Z](?:,\s*[A-Z])+)$/);
    if (multiSelectNoBrackets) {
      const qNum = parseInt(multiSelectNoBrackets[1], 10);
      const letters = multiSelectNoBrackets[2].split(",").map(s => s.trim());
      const indices = letters.map(letter => letter.toUpperCase().charCodeAt(0) - 65);
      answers[qNum] = indices;
      continue;
    }
    
    // Простой ответ: "1B" или "1A" или " 1A " (с пробелами) или "20A."
    // Проверяем сначала простые ответы, чтобы не перехватить их другими паттернами
    const simpleMatch = trimmedPart.match(/^(\d+)([A-Z])\.?$/);
    if (simpleMatch) {
      const qNum = parseInt(simpleMatch[1], 10);
      const letter = simpleMatch[2].toUpperCase();
      const answerIndex = letter.charCodeAt(0) - 65; // A=0, B=1, C=2, ...
      answers[qNum] = answerIndex;
      continue;
    }
    
    // Формат с двоеточием: "2: 1–A,2–D,3–C,4–B" (matching)
    const colonMatch = trimmedPart.match(/^(\d+):\s*(.+)$/);
    if (colonMatch) {
      const qNum = parseInt(colonMatch[1], 10);
      const pairsText = colonMatch[2];
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
    
    // Если не простой ответ, проверяем сложные форматы
    if (!trimmedPart.includes("(")) {
      // Если нет скобок и не простой ответ, пропускаем
      continue;
    }
    
    // Matching: "3(1–B,2–A,3–C,4–D)" или "2(1B2D3A4C)" (без тире и запятых)
    const matchingMatch = trimmedPart.match(/^(\d+)\(([^)]+)\)$/);
    if (matchingMatch) {
      const qNum = parseInt(matchingMatch[1], 10);
      const pairsText = matchingMatch[2];
      
      // Формат 1: с тире и запятыми "1–B,2–A,3–C,4–D"
      if (pairsText.match(/^\d+[–-][A-Z]/)) {
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
      
      // Формат 2: без тире и запятых "1B2D3A4C"
      const compactMatching = pairsText.match(/^(\d[A-Z])+$/);
      if (compactMatching) {
        const pairs: [number, number][] = [];
        const pairMatches = pairsText.match(/(\d)([A-Z])/g);
        if (pairMatches) {
          for (const pairMatch of pairMatches) {
            const m = pairMatch.match(/(\d)([A-Z])/);
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
    
    // Ordering: "5(D→A→C→B)" или "6(A→B→C→D)" или "4 A→B→C→D" (без скобок)
    const orderingMatch1 = trimmedPart.match(/^(\d+)\(([^)]+)\)$/);
    if (orderingMatch1 && orderingMatch1[2].includes("→")) {
      const qNum = parseInt(orderingMatch1[1], 10);
      const orderText = orderingMatch1[2];
      const letters = orderText.split(/[→-]/).map(s => s.trim());
      const order = letters.map(letter => {
        const idx = letter.toUpperCase().charCodeAt(0) - 65;
        return idx;
      });
      answers[qNum] = order;
      continue;
    }
    
    // Ordering без скобок: "4 A→B→C→D"
    const orderingMatch2 = trimmedPart.match(/^(\d+)\s+([A-Z](?:[→-][A-Z])+)$/);
    if (orderingMatch2 && orderingMatch2[2].includes("→")) {
      const qNum = parseInt(orderingMatch2[1], 10);
      const orderText = orderingMatch2[2];
      const letters = orderText.split(/[→-]/).map(s => s.trim());
      const order = letters.map(letter => {
        const idx = letter.toUpperCase().charCodeAt(0) - 65;
        return idx;
      });
      answers[qNum] = order;
      continue;
    }
    
    // Multiple select: "2(A,D)" или "5(A,C)" или "16(A,C)" или "6 A,D" (без скобок)
    const multiSelectMatch1 = trimmedPart.match(/^(\d+)\(([^)]+)\)$/);
    if (multiSelectMatch1 && multiSelectMatch1[2].match(/^[A-Z](,\s*[A-Z])+$/)) {
      const qNum = parseInt(multiSelectMatch1[1], 10);
      const letters = multiSelectMatch1[2].split(",").map(s => s.trim());
      const indices = letters.map(letter => letter.toUpperCase().charCodeAt(0) - 65);
      answers[qNum] = indices;
      continue;
    }
    
    // Multiple select без скобок: "6 A,D"
    const multiSelectMatch2 = trimmedPart.match(/^(\d+)\s+([A-Z](?:,\s*[A-Z])+)$/);
    if (multiSelectMatch2) {
      const qNum = parseInt(multiSelectMatch2[1], 10);
      const letters = multiSelectMatch2[2].split(",").map(s => s.trim());
      const indices = letters.map(letter => letter.toUpperCase().charCodeAt(0) - 65);
      answers[qNum] = indices;
      continue;
    }
    
    // Grouping: "7(A,B / C,D)" или "7(Объём A,C,E; Масса B,D)" или "8 У: A,C / С: B,D,E"
    const groupingMatch1 = trimmedPart.match(/^(\d+)\(([^)]+)\)$/);
    if (groupingMatch1 && (groupingMatch1[2].includes("/") || groupingMatch1[2].includes(";"))) {
      const qNum = parseInt(groupingMatch1[1], 10);
      const groupsText = groupingMatch1[2];
      // Разделяем по "/" или ";" для категорий
      const separator = groupsText.includes(";") ? ";" : "/";
      const categoryParts = groupsText.split(separator);
      
      const categoryArrays: number[][] = [];
      for (const catPart of categoryParts) {
        // Убираем название категории (все до первой буквы варианта)
        // Формат: "Объём A,C,E" или "A,C,E" или "У: A,C"
        const cleanPart = catPart.trim().replace(/^[^A-Z]+/, ""); // Убираем все до первой заглавной буквы
        const letters = cleanPart.split(",").map(s => s.trim());
        const indices = letters.map(letter => {
          const cleanLetter = letter.trim();
          if (cleanLetter.match(/^[A-Z]$/)) {
            return cleanLetter.toUpperCase().charCodeAt(0) - 65;
          }
          return -1;
        }).filter(idx => idx >= 0);
        if (indices.length > 0) {
          categoryArrays.push(indices);
        }
      }
      answers[qNum] = categoryArrays;
      continue;
    }
    
    // Grouping без скобок: "8 У: A,C / С: B,D,E"
    const groupingMatch2 = trimmedPart.match(/^(\d+)\s+(.+)$/);
    if (groupingMatch2 && groupingMatch2[2].includes("/")) {
      const qNum = parseInt(groupingMatch2[1], 10);
      const groupsText = groupingMatch2[2];
      const categoryParts = groupsText.split("/");
      const categoryArrays: number[][] = [];
      for (const catPart of categoryParts) {
        const letters = catPart.split(",").map(s => s.trim().replace(/^[^:]+:\s*/, "")); // Убираем префикс типа "У:"
        const indices = letters.map(letter => {
          const cleanLetter = letter.trim();
          if (cleanLetter.match(/^[A-Z]$/)) {
            return cleanLetter.toUpperCase().charCodeAt(0) - 65;
          }
          return -1;
        }).filter(idx => idx >= 0);
        if (indices.length > 0) {
          categoryArrays.push(indices);
        }
      }
      answers[qNum] = categoryArrays;
      continue;
    }
    
    // Cloze: "11([1]=A)" или "5[1A]" (компактный формат) или "10 [1]=A" (без скобок)
    const clozeMatch1 = trimmedPart.match(/^(\d+)\(\[(\d+)\]=([A-Z])\)$/);
    if (clozeMatch1) {
      const qNum = parseInt(clozeMatch1[1], 10);
      const gapIdx = parseInt(clozeMatch1[2], 10);
      const letter = clozeMatch1[3].toUpperCase();
      const answerIndex = letter.charCodeAt(0) - 65;
      answers[qNum] = { [gapIdx]: answerIndex };
      continue;
    }
    
    // Cloze компактный формат: "5[1A]"
    const clozeMatchCompact = trimmedPart.match(/^(\d+)\[(\d+)([A-Z])\]$/);
    if (clozeMatchCompact) {
      const qNum = parseInt(clozeMatchCompact[1], 10);
      const gapIdx = parseInt(clozeMatchCompact[2], 10);
      const letter = clozeMatchCompact[3].toUpperCase();
      const answerIndex = letter.charCodeAt(0) - 65;
      answers[qNum] = { [gapIdx]: answerIndex };
      continue;
    }
    
    
    // Cloze без скобок: "10 [1]=A"
    const clozeMatch2 = trimmedPart.match(/^(\d+)\s+\[(\d+)\]=([A-Z])$/);
    if (clozeMatch2) {
      const qNum = parseInt(clozeMatch2[1], 10);
      const gapIdx = parseInt(clozeMatch2[2], 10);
      const letter = clozeMatch2[3].toUpperCase();
      const answerIndex = letter.charCodeAt(0) - 65;
      answers[qNum] = { [gapIdx]: answerIndex };
      continue;
    }
    
    // Two-step: "1(Ч1A Ч2A)" или "2(Ч1=A;Ч2=A)" или "10 Ч1=A;Ч2=A" (без скобок)
    // Формат 1: "Ч1A Ч2A" (без знака равенства, с пробелом)
    const twoStepMatch1 = trimmedPart.match(/^(\d+)\([ЧЧ]1\s*([A-Z])\s+[ЧЧ]2\s*([A-Z])\)$/);
    if (twoStepMatch1) {
      const qNum = parseInt(twoStepMatch1[1], 10);
      const step1Letter = twoStepMatch1[2].toUpperCase();
      const step2Letter = twoStepMatch1[3].toUpperCase();
      const step1Idx = step1Letter.charCodeAt(0) - 65;
      const step2Idx = step2Letter.charCodeAt(0) - 65;
      answers[qNum] = { step1: step1Idx, step2: step2Idx };
      continue;
    }
    
    // Формат 2: "Ч1=A;Ч2=A" (со знаком равенства)
    const twoStepMatch2 = trimmedPart.match(/^(\d+)\([ЧЧ]1=([A-Z]);[ЧЧ]2=([A-Z])\)$/);
    if (twoStepMatch2) {
      const qNum = parseInt(twoStepMatch2[1], 10);
      const step1Letter = twoStepMatch2[2].toUpperCase();
      const step2Letter = twoStepMatch2[3].toUpperCase();
      const step1Idx = step1Letter.charCodeAt(0) - 65;
      const step2Idx = step2Letter.charCodeAt(0) - 65;
      answers[qNum] = { step1: step1Idx, step2: step2Idx };
      continue;
    }
    
    // Two-step без скобок: "10 Ч1=A;Ч2=A"
    const twoStepMatch3 = trimmedPart.match(/^(\d+)\s+[ЧЧ]1=([A-Z]);[ЧЧ]2=([A-Z])$/);
    if (twoStepMatch3) {
      const qNum = parseInt(twoStepMatch3[1], 10);
      const step1Letter = twoStepMatch3[2].toUpperCase();
      const step2Letter = twoStepMatch3[3].toUpperCase();
      const step1Idx = step1Letter.charCodeAt(0) - 65;
      const step2Idx = step2Letter.charCodeAt(0) - 65;
      answers[qNum] = { step1: step1Idx, step2: step2Idx };
      continue;
    }
    
    // Matrix: "4(1–A;2–B;3–C)" или "8(1A2B3C)" (компактный формат) или "12 1–A;2–B;3–C" (без скобок)
    const matrixMatch1 = trimmedPart.match(/^(\d+)\(([^)]+)\)$/);
    if (matrixMatch1) {
      const qNum = parseInt(matrixMatch1[1], 10);
      const pairsText = matrixMatch1[2];
      
      // Формат 1: с точкой с запятой и тире "1–A;2–B;3–C"
      if (pairsText.includes(";") && pairsText.match(/\d+[–-][A-Z]/)) {
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
      
      // Формат 2: компактный "1A2B3C"
      const compactMatrix = pairsText.match(/^(\d[A-Z])+$/);
      if (compactMatrix && !pairsText.includes("→")) {
        const pairs: Record<number, number> = {};
        const pairMatches = pairsText.match(/(\d)([A-Z])/g);
        if (pairMatches) {
          for (const pairMatch of pairMatches) {
            const m = pairMatch.match(/(\d)([A-Z])/);
            if (m) {
              const rowIdx = parseInt(m[1], 10) - 1; // 1-based to 0-based
              const colLetter = m[2].toUpperCase();
              const colIdx = colLetter.charCodeAt(0) - 65;
              pairs[rowIdx] = colIdx;
            }
          }
        }
        answers[qNum] = pairs;
        continue;
      }
    }
    
    // Matrix без скобок: "12 1–A;2–B;3–C"
    const matrixMatch2 = trimmedPart.match(/^(\d+)\s+(\d+[–-][A-Z](?:;\s*\d+[–-][A-Z])+)$/);
    if (matrixMatch2) {
      const qNum = parseInt(matrixMatch2[1], 10);
      const pairsText = matrixMatch2[2];
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
    
    // Select errors: "11(2,6)" или "16 2,5" (без скобок)
    const errorsMatch1 = trimmedPart.match(/^(\d+)\((\d+(?:,\s*\d+)+)\)$/);
    if (errorsMatch1) {
      const qNum = parseInt(errorsMatch1[1], 10);
      const errorNums = errorsMatch1[2].split(",").map(s => parseInt(s.trim(), 10) - 1); // 1-based to 0-based
      answers[qNum] = errorNums;
      continue;
    }
    
    // Select errors без скобок: "16 2,5"
    const errorsMatch2 = trimmedPart.match(/^(\d+)\s+(\d+(?:,\s*\d+)+)$/);
    if (errorsMatch2) {
      const qNum = parseInt(errorsMatch2[1], 10);
      const errorNums = errorsMatch2[2].split(",").map(s => parseInt(s.trim(), 10) - 1); // 1-based to 0-based
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
    
    // True/False: "4(Неверно;A)" или "10(Верно;A)" или "11(Верно;A)" или "5 Неверно/C? (A)"
    const tfMatch1 = trimmedPart.match(/^(\d+)\(([Вв]ерно|[Нн]еверно);([A-Z])\)$/);
    if (tfMatch1) {
      const qNum = parseInt(tfMatch1[1], 10);
      const isTrue = /верно/i.test(tfMatch1[2]);
      const reasonIdx = tfMatch1[3].toUpperCase().charCodeAt(0) - 65;
      answers[qNum] = { answer: isTrue, reason: reasonIdx };
      continue;
    }
    
    // Формат "5 Неверно/C? (A)" или "4Верно/C? (A)" - True/False с причиной
    const tfMatch2 = trimmedPart.match(/^(\d+)\s*([Вв]ерно|[Нн]еверно)(?:\/[A-Z])?\?\s*\(([A-Z])\)$/);
    if (tfMatch2) {
      const qNum = parseInt(tfMatch2[1], 10);
      const isTrue = /верно/i.test(tfMatch2[2]);
      const reasonIdx = tfMatch2[3].toUpperCase().charCodeAt(0) - 65;
      answers[qNum] = { answer: isTrue, reason: reasonIdx };
      continue;
    }
    
    // Формат без скобок: "4Неверно/A" или "15Верно/A"
    const tfMatchNoBrackets = trimmedPart.match(/^(\d+)([Вв]ерно|[Нн]еверно)\/([A-Z])$/);
    if (tfMatchNoBrackets) {
      const qNum = parseInt(tfMatchNoBrackets[1], 10);
      const isTrue = /верно/i.test(tfMatchNoBrackets[2]);
      const reasonIdx = tfMatchNoBrackets[3].toUpperCase().charCodeAt(0) - 65;
      answers[qNum] = { answer: isTrue, reason: reasonIdx };
      continue;
    }
    
    // Универсальный формат True/False: "4Верно (A)" или любой текст между статусом и скобкой
    const tfMatch3 = trimmedPart.match(/^(\d+)\s*([Вв]ерно|[Нн]еверно)[^(]*\(([A-Z])\)$/);
    if (tfMatch3) {
      const qNum = parseInt(tfMatch3[1], 10);
      const isTrue = /верно/i.test(tfMatch3[2]);
      const reasonIdx = tfMatch3[3].toUpperCase().charCodeAt(0) - 65;
      answers[qNum] = { answer: isTrue, reason: reasonIdx };
      continue;
    }
  }
  
  return answers;
}

/**
 * Извлекает метаданные теста из заголовка
 * Формат: ## ТЕСТ 1 (Простой). **«Пять колонн пузырьков: базовая сборка»**
 * Или: ТЕСТ 1 — «Три штриха баланса»
 * Или: ТЕСТ 3 (Сложный) — «Инженерия вкуса»
 */
function parseTestHeader(header: string, testNumber: number): { title: string; level: string } | null {
  // Формат с ## и скобками: ## ТЕСТ 1 (Простой). **«...»**
  const match = header.match(/ТЕСТ\s+\d+\s*\(([^)]+)\)[.\s]*\*\*[«"]?([^»"]+)[»"]?\*\*/i);
  if (match) {
    return {
      title: match[2].trim(),
      level: match[1].trim(),
    };
  }
  
  // Формат baza1.txt: ТЕСТ 1 — «Три штриха баланса» или ТЕСТ 3 (Сложный) — «Инженерия вкуса»
  // Используем Unicode для em dash (—) и en dash (–)
  const match2 = header.match(/ТЕСТ\s+\d+\s*(?:\(([^)]+)\)\s*)?[—–\-]\s*[«"]?([^»"]+)[»"]?/i);
  if (match2) {
    const level = match2[1] ? match2[1].trim() : (testNumber === 1 ? "Простой" : testNumber === 2 ? "Средний" : "Сложный");
    return {
      title: match2[2].trim(),
      level: level,
    };
  }
  
  // Альтернативный формат без кавычек
  const match3 = header.match(/ТЕСТ\s+\d+\s*\(([^)]+)\)[.\s]*(.+)/i);
  if (match3) {
    return {
      title: match3[2].trim().replace(/\*\*/g, "").replace(/[«"]/g, "").replace(/[»"]/g, ""),
      level: match3[1].trim(),
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
  
  // Находим строку с вопросом (начинается с "**Вопрос X.**" или "**Задание X.**" или "Вопрос X." или "Задание X.")
  let questionLine = "";
  let questionTextLine = "";
  let mechanic: QuestionMechanic = "multiple-choice";
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Поддерживаем оба формата: с ** и без
    if (line.match(/^(?:\*\*)?Вопрос\s+\d+[\.\)]/i) || line.match(/^(?:\*\*)?Задание\s+\d+/i)) {
      // Извлекаем текст вопроса и механику
      const questionMatch = line.match(/^(?:\*\*)?(?:Вопрос|Задание)\s+\d+[\.\)]\s*(.+)/i) || 
                           line.match(/^(?:\*\*)?Задание\s+\d+\s*\([^)]+\)[\.\)]\s*(.+)/i);
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
        questionTextLine = line.replace(/^(?:\*\*)?(?:Вопрос|Задание)\s+\d+[\.\)].*\s*/i, "").trim();
        mechanic = detectMechanic(line);
        break;
      }
    }
  }
  
  if (!questionTextLine) {
    // Пытаемся взять первую строку
    questionTextLine = lines[0].replace(/^(?:\*\*)?(?:Вопрос|Задание)\s+\d+[\.\)].*\s*/i, "").trim();
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
      // Останавливаемся при встрече ответов и пояснений
      if (/^Ответ:/i.test(line) || /^Пояснение:/i.test(line) || /^\*\*Ответ:/i.test(line) || /^\*\*Пояснение:/i.test(line)) {
        inLeft = false;
        inRight = false;
        continue;
      }
      
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
        // Пропускаем строки с ответами и пояснениями
        if (/^Ответ:/i.test(line) || /^Пояснение:/i.test(line) || /^\*\*Ответ:/i.test(line) || /^\*\*Пояснение:/i.test(line)) {
          continue;
        }
        const itemMatch = line.match(/^([A-Z])\)\s*(.+)$/);
        if (itemMatch) {
          items.push(itemMatch[2].trim());
        } else if (line && !line.match(/^[A-Z]\)/) && !line.match(/^\d+\./) && !line.match(/^Ответ:/i) && !line.match(/^Пояснение:/i)) {
          items.push(line);
        }
      }
    }
    
    if (items.length > 0) question.items = items;
    
    if (mechanic === "grouping") {
      const categories: string[] = [];
      
      for (const line of lines) {
        if (/^Категории:/i.test(line)) {
          // Извлекаем категории из строки "Категории: «Категория 1», «Категория 2»"
          const catLine = line.replace(/^Категории:\s*/i, "").trim();
          // Убираем кавычки и разбиваем по запятым
          const catMatches = catLine.match(/[«"]([^»"]+)[»"]/g);
          if (catMatches) {
            for (const match of catMatches) {
              const cat = match.replace(/[«»"]/g, "").trim();
              if (cat) categories.push(cat);
            }
          } else {
            // Альтернативный формат без кавычек: "Категории: Категория 1, Категория 2"
            const parts = catLine.split(",").map(p => p.trim()).filter(p => p);
            categories.push(...parts);
          }
          break;
        }
      }
      
      if (categories.length > 0) question.categories = categories;
    }
  } else if (mechanic === "cloze-dropdown") {
    const gaps: Array<{ index: number; options: string[] }> = [];
    let clozeText = questionTextLine;
    
    // Ищем строку "Текст:" для извлечения полного текста
    for (const line of lines) {
      if (/^Текст:/i.test(line)) {
        const textMatch = line.match(/^Текст:\s*[«"]?([^»"]+)[»"]?/i);
        if (textMatch) {
          clozeText = textMatch[1].trim();
          question.text = clozeText;
        } else {
          // Альтернативный формат без кавычек
          const textMatch2 = line.replace(/^Текст:\s*/i, "").trim();
          if (textMatch2) {
            clozeText = textMatch2;
            question.text = clozeText;
          }
        }
        break;
      }
    }
    
    // Ищем пропуски вида [1: ___] в тексте
    const gapMatches = clozeText.matchAll(/\[(\d+):\s*___\]/g);
    const gapIndices: number[] = [];
    for (const gapMatch of gapMatches) {
      gapIndices.push(parseInt(gapMatch[1], 10));
    }
    
    // Для каждого пропуска ищем варианты
    for (const gapIndex of gapIndices) {
      const options: string[] = [];
      let inOptions = false;
      let foundGapOptions = false;
      
      for (const line of lines) {
        const optionsMatch = line.match(/^Варианты для\s*\[(\d+)\]:/i);
        if (optionsMatch && parseInt(optionsMatch[1], 10) === gapIndex) {
          inOptions = true;
          foundGapOptions = true;
          continue;
        }
        if (inOptions) {
          const optMatch = line.match(/^([A-Z])\)\s*(.+)$/);
          if (optMatch) {
            options.push(optMatch[2].trim());
          } else if (/^Варианты для/i.test(line) || /^Ответ:/i.test(line) || /^Пояснение:/i.test(line)) {
            // Конец вариантов для этого пропуска
            break;
          }
        }
      }
      
      // Если не нашли специфичные варианты для пропуска, ищем общие варианты
      if (!foundGapOptions && gapIndices.length === 1) {
        for (const line of lines) {
          if (/^Варианты для/i.test(line)) {
            inOptions = true;
            continue;
          }
          if (inOptions) {
            const optMatch = line.match(/^([A-Z])\)\s*(.+)$/);
            if (optMatch) {
              options.push(optMatch[2].trim());
            } else if (/^Ответ:/i.test(line) || /^Пояснение:/i.test(line)) {
              break;
            }
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
    
    // Ищем "**Пояснение:**" или "Пояснение:" после вопроса
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
    } else if (/^(?:\*\*)?Вопрос\s+(\d+)[\.\)]/i.test(line) || /^(?:\*\*)?Задание\s+(\d+)/i.test(line)) {
      const match = line.match(/^(?:\*\*)?Вопрос\s+(\d+)[\.\)]/i) || line.match(/^(?:\*\*)?Задание\s+(\d+)/i);
      if (match) {
        currentQuestionNum = parseInt(match[1], 10);
      }
    }
    
    // Продолжение пояснения на следующей строке
    if (currentQuestionNum > 0 && hints[currentQuestionNum] && line && !line.match(/^(?:\*\*)?Вопрос/i) && !line.match(/^(?:\*\*)?Задание/i) && !line.match(/^[A-Z]\)/) && !line.match(/^\d+\./)) {
      if (!line.match(/^Пояснение:/i) && !line.match(/^Ключ/i) && !line.match(/^---/) && !line.match(/^Правильный ответ:/i)) {
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
  
  // СНАЧАЛА извлекаем все ключи ответов из файла
  const allKeys: Record<number, string> = {};
  // Формат: **Ключ (Тест 1):** 1A, 2(1B2D3A4C), ...
  const keyRegex = /\*\*Ключ\s*\(Тест\s+(\d+)\):\*\*\s*(.+?)(?=\n\n|---|\*\*Ключ|$)/gs;
  let keyMatch;
  while ((keyMatch = keyRegex.exec(content)) !== null) {
    const testNum = parseInt(keyMatch[1], 10);
    const keyText = keyMatch[2].trim();
    allKeys[testNum] = keyText;
  }
  
  // Разделяем на тесты по заголовкам "## ТЕСТ X" или "ТЕСТ X"
  const testSections = content.split(/(?=(?:##\s+)?ТЕСТ\s+\d+)/i);
  
  for (const section of testSections) {
    if (!section.trim()) continue;
    
    const lines = section.split("\n");
    let currentLine = 0;
    
    // Парсим заголовок
    let headerLine = "";
    let testNumber = 0;
    while (currentLine < lines.length && !headerLine) {
      const testMatch = lines[currentLine].match(/^(?:##\s+)?ТЕСТ\s+(\d+)/i);
      if (testMatch) {
        headerLine = lines[currentLine];
        testNumber = parseInt(testMatch[1], 10);
        break;
      }
      currentLine++;
    }
    
    if (!headerLine) continue;
    
    const metadata = parseTestHeader(headerLine, testNumber);
    if (!metadata) continue;
    
    currentLine++;
    
    // Используем предварительно найденный ключ для этого теста
    let answerKey: Record<number, any> = {};
    let keyLineIndex = -1;
    
    const answerKeyText = allKeys[testNumber];
    if (answerKeyText) {
      answerKey = parseAnswerKey(answerKeyText);
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
      
      // Начало нового вопроса (поддерживаем оба формата: с ** и без)
      if (/^(?:\*\*)?Вопрос\s+\d+[\.\)]/i.test(line) || /^(?:\*\*)?Задание\s+\d+/i.test(line)) {
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
      const testNum = testNumber || tests.length + 1;
      const testId = `mixology-${levelKey}-${testNum}`;
      
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
