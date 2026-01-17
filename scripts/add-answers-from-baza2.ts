import * as fs from "fs";
import * as path from "path";

/**
 * Скрипт для добавления правильных ответов из baza2.txt в answer.ts файлы
 */

function parseAnswer(answerText: string, questionType: string): any {
  answerText = answerText.trim();
  
  // Single select: "C" -> 2 (A=0, B=1, C=2, D=3)
  if (/^[A-Z]$/.test(answerText)) {
    return answerText.charCodeAt(0) - 65;
  }
  
  // Multiple select: "A, B, D" -> [0, 1, 3]
  if (/^[A-Z](?:,\s*[A-Z])+$/.test(answerText)) {
    return answerText.split(",").map(s => s.trim().charCodeAt(0) - 65);
  }
  
  // Cloze dropdown: "[1]=B, [2]=A" -> [1, 0]
  if (/^\[(\d+)\]=([A-Z])(?:,\s*\[(\d+)\]=([A-Z]))*$/.test(answerText)) {
    const matches = answerText.matchAll(/\[(\d+)\]=([A-Z])/g);
    const result: number[] = [];
    for (const match of matches) {
      const index = parseInt(match[1], 10) - 1; // 1-based to 0-based
      const letter = match[2].charCodeAt(0) - 65;
      result[index] = letter;
    }
    return result;
  }
  
  // Matching: "1–A, 2–B, 3–A, 4–A" -> [[0,0],[1,1],[2,0],[3,0]]
  if (/^\d+[–-][A-Z](?:,\s*\d+[–-][A-Z])*$/.test(answerText)) {
    const pairs: [number, number][] = [];
    const matches = answerText.matchAll(/(\d+)[–-]([A-Z])/g);
    for (const match of matches) {
      const left = parseInt(match[1], 10) - 1; // 1-based to 0-based
      const right = match[2].charCodeAt(0) - 65;
      pairs.push([left, right]);
    }
    return pairs;
  }
  
  // Ordering: "B → C → D → A" -> [1, 2, 3, 0]
  if (/^[A-Z](?:\s*→\s*[A-Z])+$/.test(answerText)) {
    return answerText.split("→").map(s => s.trim().charCodeAt(0) - 65);
  }
  
  // True/False: "Неверно; причина: A" или "True — ..." -> {answer: false, reason: 0}
  if (/^(?:True|Верно|Неверно|False)/i.test(answerText)) {
    const isTrue = /^(?:True|Верно)/i.test(answerText);
    const reasonMatch = answerText.match(/[;:]\s*([A-Z])/);
    const reason = reasonMatch ? reasonMatch[1].charCodeAt(0) - 65 : 0;
    return { answer: isTrue, reason };
  }
  
  // Two-step: "Шаг 1 — A; Шаг 2 — B" -> {step1: 0, step2Mapping: {...}}
  if (/Шаг\s+1\s*[—–-]\s*([A-Z]);\s*Шаг\s+2\s*[—–-]\s*([A-Z])/i.test(answerText)) {
    const match = answerText.match(/Шаг\s+1\s*[—–-]\s*([A-Z]);\s*Шаг\s+2\s*[—–-]\s*([A-Z])/i);
    if (match) {
      const step1 = match[1].charCodeAt(0) - 65;
      const step2 = match[2].charCodeAt(0) - 65;
      return { step1, step2Mapping: { [step1]: step2 } };
    }
  }
  
  // Select errors: "2, 5" -> [1, 4] (1-based to 0-based)
  if (/^\d+(?:,\s*\d+)*$/.test(answerText)) {
    return answerText.split(",").map(s => parseInt(s.trim(), 10) - 1);
  }
  
  // Grouping: "Гр.1: а, в, г, е. Гр.2: б, д." -> {"Гр.1": [0,2,3,4], "Гр.2": [1,4]}
  // Но в нашем случае формат может быть другим, нужно проверить
  
  console.warn(`Не удалось распарсить ответ: ${answerText} для типа ${questionType}`);
  return null;
}

function extractAnswersFromBaza2(content: string): Record<number, Record<number, any>> {
  const tests: Record<number, Record<number, any>> = {};
  const lines = content.split("\n");
  
  let currentTest = 0;
  let currentQuestion = 0;
  let inQuestion = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Начало нового теста
    if (line.match(/^ТЕСТ\s+(\d+)/i)) {
      const match = line.match(/^ТЕСТ\s+(\d+)/i);
      if (match) {
        currentTest = parseInt(match[1], 10);
        tests[currentTest] = {};
        currentQuestion = 0;
      }
      continue;
    }
    
    // Начало вопроса
    if (line.match(/^(?:Вопрос|Задание)\s+(\d+)/i)) {
      const match = line.match(/^(?:Вопрос|Задание)\s+(\d+)/i);
      if (match) {
        currentQuestion = parseInt(match[1], 10);
        inQuestion = true;
      }
      continue;
    }
    
    // Правильный ответ
    if (line.startsWith("Правильный ответ:") && inQuestion) {
      const answerText = line.replace("Правильный ответ:", "").trim();
      if (currentTest > 0 && currentQuestion > 0) {
        // Определяем тип вопроса из предыдущих строк
        let questionType = "multiple-choice";
        for (let j = i - 5; j < i; j++) {
          if (j >= 0 && lines[j]) {
            const prevLine = lines[j].toLowerCase();
            if (prevLine.includes("multiple select")) questionType = "multiple-select";
            else if (prevLine.includes("matching")) questionType = "matching";
            else if (prevLine.includes("ordering")) questionType = "ordering";
            else if (prevLine.includes("dropdown cloze") || prevLine.includes("cloze")) questionType = "cloze-dropdown";
            else if (prevLine.includes("true/false") || prevLine.includes("true-false")) questionType = "true-false-enhanced";
            else if (prevLine.includes("two-step") || prevLine.includes("branching")) questionType = "two-step";
            else if (prevLine.includes("select errors")) questionType = "select-errors";
            else if (prevLine.includes("grouping") || prevLine.includes("classification")) questionType = "grouping";
            else if (prevLine.includes("grid") || prevLine.includes("matrix")) questionType = "matrix";
            else if (prevLine.includes("scenario")) questionType = "scenario";
            else if (prevLine.includes("best")) questionType = "best-example";
          }
        }
        
        const parsedAnswer = parseAnswer(answerText, questionType);
        if (parsedAnswer !== null) {
          tests[currentTest][currentQuestion] = parsedAnswer;
        }
      }
      inQuestion = false;
      continue;
    }
  }
  
  return tests;
}

function updateAnswerFile(testId: string, answers: Record<number, any>) {
  const answerFilePath = path.join(__dirname, `../src/tests/${testId}/answer.ts`);
  
  if (!fs.existsSync(answerFilePath)) {
    console.error(`Файл не найден: ${answerFilePath}`);
    return;
  }
  
  let content = fs.readFileSync(answerFilePath, "utf-8");
  
  // Находим answerKey объект
  const answerKeyMatch = content.match(/answerKey:\s*\{([^}]+)\}/s);
  if (!answerKeyMatch) {
    console.error(`Не найден answerKey в файле ${answerFilePath}`);
    return;
  }
  
  // Создаем новый answerKey
  const answerKeyEntries: string[] = [];
  for (const [qNum, answer] of Object.entries(answers)) {
    const qId = `q${qNum}`;
    let answerStr = "";
    
    if (answer === null || answer === undefined) {
      answerStr = "null";
    } else if (typeof answer === "number") {
      answerStr = answer.toString();
    } else if (Array.isArray(answer)) {
      if (answer.length > 0 && Array.isArray(answer[0])) {
        // Matching: [[0,0],[1,1]]
        answerStr = `[${answer.map(pair => `[${pair[0]},${pair[1]}]`).join(",")}]`;
      } else {
        // Multiple select или cloze: [0,1,3]
        answerStr = `[${answer.join(",")}]`;
      }
    } else if (typeof answer === "object") {
      // True/false или two-step
      if ("answer" in answer && "reason" in answer) {
        answerStr = `{answer: ${answer.answer}, reason: ${answer.reason}}`;
      } else if ("step1" in answer && "step2Mapping" in answer) {
        const mapping = Object.entries(answer.step2Mapping)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
        answerStr = `{step1: ${answer.step1}, step2Mapping: {${mapping}}}`;
      } else {
        // Grouping
        const entries = Object.entries(answer)
          .map(([k, v]) => `"${k}": [${(v as number[]).join(",")}]`)
          .join(", ");
        answerStr = `{${entries}}`;
      }
    } else {
      answerStr = JSON.stringify(answer);
    }
    
    answerKeyEntries.push(`    ${qId}: ${answerStr}`);
  }
  
  const newAnswerKey = `answerKey: {\n${answerKeyEntries.join(",\n")}\n  }`;
  content = content.replace(/answerKey:\s*\{[^}]+\}/s, newAnswerKey);
  
  fs.writeFileSync(answerFilePath, content, "utf-8");
  console.log(`✓ Обновлен ${answerFilePath}`);
}

function main() {
  const baza2Path = path.join(__dirname, "../src/tests/baza2.txt");
  
  if (!fs.existsSync(baza2Path)) {
    console.error(`Файл не найден: ${baza2Path}`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(baza2Path, "utf-8");
  const allAnswers = extractAnswersFromBaza2(content);
  
  console.log("Найденные ответы:");
  for (const [testNum, answers] of Object.entries(allAnswers)) {
    console.log(`Тест ${testNum}: ${Object.keys(answers).length} ответов`);
  }
  
  // Обновляем файлы
  const testMapping: Record<number, string> = {
    1: "carbonization-base-1",
    2: "carbonization-practice-2",
    3: "carbonization-advanced-3",
  };
  
  for (const [testNum, answers] of Object.entries(allAnswers)) {
    const testId = testMapping[parseInt(testNum, 10)];
    if (testId) {
      updateAnswerFile(testId, answers);
    }
  }
  
  console.log("\n✓ Обновление завершено");
}

if (require.main === module) {
  main();
}
