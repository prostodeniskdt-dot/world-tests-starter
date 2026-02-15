import * as fs from "fs";
import * as path from "path";

interface ValidationError {
  testNumber?: number;
  questionNumber?: number;
  type: "error" | "warning";
  message: string;
  line?: number;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  testsFound: number;
  keysFound: number;
  questionsFound: Record<number, number>;
}

/**
 * Валидация файла baza.txt
 */
function validateBazaFile(content: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  const lines = content.split("\n");
  
  // 1. Проверяем наличие ключей ответов
  const keyRegex = /\*\*Ключ\s*\(Тест\s+(\d+)\):\*\*\s*(.+?)(?=\n\n|---|\*\*Ключ|$)/gs;
  const allKeys: Record<number, string> = {};
  let keyMatch;
  let keyCount = 0;
  
  while ((keyMatch = keyRegex.exec(content)) !== null) {
    const testNum = parseInt(keyMatch[1], 10);
    const keyText = keyMatch[2].trim();
    allKeys[testNum] = keyText;
    keyCount++;
    
    // Проверяем формат ключа
    if (!keyText || keyText.length < 2) {
      errors.push({
        testNumber: testNum,
        type: "error",
        message: `Ключ для теста ${testNum} пустой или слишком короткий`,
      });
    }
  }
  
  // 2. Проверяем наличие тестов
  const testRegex = /(?:##\s+)?ТЕСТ\s+(\d+)/gi;
  const testNumbers: number[] = [];
  let testMatch;
  
  while ((testMatch = testRegex.exec(content)) !== null) {
    const testNum = parseInt(testMatch[1], 10);
    if (!testNumbers.includes(testNum)) {
      testNumbers.push(testNum);
    }
  }
  
  testNumbers.sort((a, b) => a - b);
  
  // Проверяем соответствие ключей и тестов
  for (const testNum of testNumbers) {
    if (!allKeys[testNum]) {
      errors.push({
        testNumber: testNum,
        type: "error",
        message: `Тест ${testNum} не имеет ключа ответов (**Ключ (Тест ${testNum}):**)`,
      });
    }
  }
  
  for (const testNum of Object.keys(allKeys).map(Number)) {
    if (!testNumbers.includes(testNum)) {
      warnings.push({
        testNumber: testNum,
        type: "warning",
        message: `Найден ключ для теста ${testNum}, но сам тест не найден в файле`,
      });
    }
  }
  
  // 3. Для каждого теста проверяем вопросы и ответы
  const testSections = content.split(/(?=(?:##\s+)?ТЕСТ\s+\d+)/i);
  const questionsFound: Record<number, number> = {};
  
  for (const section of testSections) {
    if (!section.trim()) continue;
    
    const testMatch = section.match(/^(?:##\s+)?ТЕСТ\s+(\d+)/i);
    if (!testMatch) continue;
    
    const testNum = parseInt(testMatch[1], 10);
    
    // Считаем вопросы в секции
    const questionMatches = section.matchAll(/^(?:\*\*)?(?:\d+\)|Вопрос\s+\d+|Задание\s+\d+)/gim);
    const questionCount = Array.from(questionMatches).length;
    questionsFound[testNum] = questionCount;
    
    if (questionCount === 0) {
      errors.push({
        testNumber: testNum,
        type: "error",
        message: `Тест ${testNum} не содержит вопросов`,
      });
    }
    
    // Проверяем формат ключа для этого теста
    if (allKeys[testNum]) {
      const keyText = allKeys[testNum];
      
      // Проверяем, что в ключе достаточно ответов
      // Считаем количество запятых и точек с запятой (грубая оценка)
      const answerParts = keyText.split(/[,;]/).filter(p => p.trim().length > 0);
      
      if (answerParts.length < questionCount * 0.5) {
        warnings.push({
          testNumber: testNum,
          type: "warning",
          message: `В ключе теста ${testNum} найдено ${answerParts.length} частей ответов, а вопросов ${questionCount}. Возможно, некоторые ответы пропущены.`,
        });
      }
      
      // Проверяем базовые паттерны ответов
      const hasBasicPattern = /^\d+[A-Z]/.test(keyText.trim()) || 
                             /\(\d+[A-Z]\)/.test(keyText) ||
                             /\d+\s*[–-]\s*[A-Z]/.test(keyText);
      
      if (!hasBasicPattern && keyText.length > 10) {
        warnings.push({
          testNumber: testNum,
          type: "warning",
          message: `Ключ для теста ${testNum} может иметь нестандартный формат. Проверьте правильность парсинга.`,
        });
      }
    }
  }
  
  // 4. Проверяем формат заголовков тестов
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const testHeaderMatch = line.match(/^(?:##\s+)?ТЕСТ\s+(\d+)/i);
    
    if (testHeaderMatch) {
      const testNum = parseInt(testHeaderMatch[1], 10);
      
      // Проверяем, есть ли описание уровня и названия
      const hasLevelAndTitle = /\(([^)]+)\)/.test(line) && /[«"].+?[»"]/.test(line);
      if (!hasLevelAndTitle) {
        // Проверяем следующую строку
        const nextLine = i + 1 < lines.length ? lines[i + 1] : "";
        if (!nextLine.trim()) {
          warnings.push({
            testNumber: testNum,
            type: "warning",
            message: `Заголовок теста ${testNum} может не содержать уровень сложности и название`,
            line: i + 1,
          });
        }
      }
    }
  }
  
  const valid = errors.length === 0;
  
  return {
    valid,
    errors,
    warnings,
    testsFound: testNumbers.length,
    keysFound: keyCount,
    questionsFound,
  };
}

/**
 * Основная функция
 */
function main() {
  const bazaPath = path.join(__dirname, "../src/tests/baza.txt");
  
  console.log("🔍 Валидация файла baza.txt...\n");
  
  if (!fs.existsSync(bazaPath)) {
    console.error(`❌ Файл не найден: ${bazaPath}`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(bazaPath, "utf-8");
  const result = validateBazaFile(content);
  
  // Выводим результаты
  console.log(`📊 Статистика:`);
  console.log(`   Найдено тестов: ${result.testsFound}`);
  console.log(`   Найдено ключей: ${result.keysFound}`);
  console.log(`   Найдено вопросов:`);
  for (const [testNum, count] of Object.entries(result.questionsFound)) {
    console.log(`     Тест ${testNum}: ${count} вопросов`);
  }
  
  console.log(`\n${result.errors.length > 0 ? '❌' : '✅'} Ошибки (${result.errors.length}):`);
  if (result.errors.length === 0) {
    console.log("   Ошибок не найдено ✓");
  } else {
    for (const error of result.errors) {
      const prefix = error.testNumber ? `Тест ${error.testNumber}: ` : "";
      const lineInfo = error.line ? ` (строка ${error.line})` : "";
      console.log(`   ❌ ${prefix}${error.message}${lineInfo}`);
    }
  }
  
  console.log(`\n${result.warnings.length > 0 ? '⚠️' : '✅'} Предупреждения (${result.warnings.length}):`);
  if (result.warnings.length === 0) {
    console.log("   Предупреждений нет ✓");
  } else {
    for (const warning of result.warnings) {
      const prefix = warning.testNumber ? `Тест ${warning.testNumber}: ` : "";
      const lineInfo = warning.line ? ` (строка ${warning.line})` : "";
      console.log(`   ⚠️  ${prefix}${warning.message}${lineInfo}`);
    }
  }
  
  console.log(`\n${result.valid ? '✅' : '❌'} Общий результат: ${result.valid ? 'Файл валиден' : 'Обнаружены ошибки'}`);
  
  if (!result.valid) {
    console.log("\n💡 Рекомендации:");
    console.log("   1. Убедитесь, что для каждого теста есть ключ ответов");
    console.log("   2. Проверьте формат ключей: **Ключ (Тест X):** 1A, 2B, ...");
    console.log("   3. Убедитесь, что количество ответов соответствует количеству вопросов");
    console.log("   4. Проверьте формат заголовков тестов: ТЕСТ X (Уровень) — «Название»");
    process.exit(1);
  } else {
    console.log("\n✅ Файл готов к парсингу!");
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}
