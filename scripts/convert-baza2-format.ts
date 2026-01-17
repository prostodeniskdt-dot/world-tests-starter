import * as fs from "fs";
import * as path from "path";

/**
 * Конвертер формата baza2.txt в формат baza1.txt
 */
function convertBaza2Format(content: string): string {
  let result = "";
  const lines = content.split("\n");
  let currentTest = "";
  let questionCounter = 0;
  let inQuestion = false;
  let questionText = "";
  let questionType = "";
  let options: string[] = [];
  let answer = "";
  let explanation = "";
  let leftItems: string[] = [];
  let rightItems: string[] = [];
  let inLeftItems = false;
  let inRightItems = false;
  let inElements = false;
  let elements: string[] = [];
  let categories = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Заголовок теста: ## ТЕСТ 1 (Простой) — «Название»
    if (line.match(/^## ТЕСТ \d+/)) {
      // Сохраняем предыдущий вопрос если был
      if (inQuestion && questionText) {
        result += formatQuestion(questionCounter, questionText, questionType, options, answer, explanation, leftItems, rightItems, elements, categories);
        resetQuestion();
      }

      currentTest = line.replace(/^##\s*/, "").replace(/\(Простой\)\s*—/, "—").replace(/\(Средний\)\s*—/, "—").replace(/\(Сложный\)\s*—/, "—");
      result += currentTest + "\n";
      questionCounter = 0;
      continue;
    }

    // Начало нового вопроса: **1) Single select**
    const questionMatch = line.match(/^\*\*(\d+)\)\s*(.+?)\*\*$/);
    if (questionMatch) {
      // Сохраняем предыдущий вопрос
      if (inQuestion && questionText) {
        result += formatQuestion(questionCounter, questionText, questionType, options, answer, explanation, leftItems, rightItems, elements, categories);
        resetQuestion();
      }

      questionCounter = parseInt(questionMatch[1], 10);
      questionType = questionMatch[2].trim();
      inQuestion = true;
      continue;
    }

    // Текст вопроса (следующая строка после типа)
    if (inQuestion && !questionText && line && !line.startsWith("A)") && !line.startsWith("**Ответ:") && !line.startsWith("Слева:") && !line.startsWith("Справа:") && !line.startsWith("Элементы:") && !line.startsWith("Категории:") && !line.startsWith("---")) {
      questionText = line;
      continue;
    }

    // Варианты ответов A) B) C) D)
    if (line.match(/^[A-Z]\)/)) {
      options.push(line);
      continue;
    }

    // Слева: (для Matching)
    if (line === "Слева:") {
      inLeftItems = true;
      inRightItems = false;
      inElements = false;
      continue;
    }

    // Справа: (для Matching)
    if (line === "Справа:") {
      inLeftItems = false;
      inRightItems = true;
      inElements = false;
      continue;
    }

    // Элементы: (для Ordering, Grouping)
    if (line === "Элементы:") {
      inLeftItems = false;
      inRightItems = false;
      inElements = true;
      continue;
    }

    // Категории: (для Grouping)
    if (line.startsWith("Категории:")) {
      categories = line.replace("Категории:", "").trim();
      inLeftItems = false;
      inRightItems = false;
      inElements = false;
      continue;
    }

    // Элементы списка
    if (line.match(/^\d+\.\s/)) {
      if (inLeftItems) {
        leftItems.push(line);
      } else if (inElements) {
        elements.push(line);
      }
      continue;
    }

    if (line.match(/^[A-Z]\)/)) {
      if (inRightItems) {
        rightItems.push(line);
      }
      continue;
    }

    // Ответ и пояснение: **Ответ: C. Пояснение:**
    const answerMatch = line.match(/^\*\*Ответ:\s*(.+?)\.\s*Пояснение:\*\*(.*)$/);
    if (answerMatch) {
      answer = answerMatch[1].trim();
      explanation = answerMatch[2].trim();
      
      // Продолжаем читать пояснение если оно на следующих строках
      let j = i + 1;
      while (j < lines.length && lines[j].trim() && !lines[j].trim().startsWith("---") && !lines[j].trim().startsWith("**")) {
        explanation += " " + lines[j].trim();
        j++;
      }
      i = j - 1;
      continue;
    }

    // Пропускаем ---
    if (line === "---") {
      continue;
    }
  }

  // Сохраняем последний вопрос
  if (inQuestion && questionText) {
    result += formatQuestion(questionCounter, questionText, questionType, options, answer, explanation, leftItems, rightItems, elements, categories);
  }

  return result;

  function resetQuestion() {
    questionText = "";
    questionType = "";
    options = [];
    answer = "";
    explanation = "";
    leftItems = [];
    rightItems = [];
    elements = [];
    categories = "";
    inQuestion = false;
    inLeftItems = false;
    inRightItems = false;
    inElements = false;
  }

  function formatQuestion(num: number, text: string, type: string, opts: string[], ans: string, exp: string, left: string[], right: string[], elems: string[], cats: string): string {
    let formatted = "";

    // Определяем тип вопроса или задания
    const isTask = type.includes("Matching") || type.includes("Ordering") || type.includes("Grouping") || type.includes("Two-step") || type.includes("Grid") || type.includes("matrix") || type.includes("Dropdown") || type.includes("Select errors");
    const prefix = isTask ? "Задание" : "Вопрос";

    formatted += `${prefix} ${num}. ${text} (${type})\n`;

    // Добавляем варианты/элементы в зависимости от типа
    if (left.length > 0 && right.length > 0) {
      // Matching
      formatted += "Слева:\n";
      left.forEach(item => formatted += item + "\n");
      formatted += "Справа:\n";
      right.forEach(item => formatted += item + "\n");
    } else if (elems.length > 0) {
      // Ordering, Grouping
      if (cats) {
        formatted += `Категории: ${cats}\n`;
      }
      formatted += "Элементы:\n";
      elems.forEach(item => formatted += item + "\n");
    } else if (opts.length > 0) {
      // Multiple choice, Multiple select
      opts.forEach(opt => formatted += opt + "\n");
    }

    // Добавляем ответ
    if (ans) {
      formatted += `Правильный ответ: ${ans}\n`;
    }

    // Добавляем пояснение
    if (exp) {
      formatted += `Пояснение: ${exp}\n`;
    }

    return formatted;
  }
}

function main() {
  const inputPath = path.join(__dirname, "../src/tests/baza2.txt");
  const outputPath = path.join(__dirname, "../src/tests/baza2-converted.txt");

  console.log("Конвертация baza2.txt в правильный формат...");

  if (!fs.existsSync(inputPath)) {
    console.error(`Файл не найден: ${inputPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(inputPath, "utf-8");
  const converted = convertBaza2Format(content);

  fs.writeFileSync(outputPath, converted, "utf-8");

  console.log(`✓ Конвертация завершена: ${outputPath}`);
}

if (require.main === module) {
  main();
}
