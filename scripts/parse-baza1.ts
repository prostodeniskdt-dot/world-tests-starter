import * as fs from "fs";
import * as path from "path";
import { parseBazaFile } from "../src/lib/parsers/baza-parser";
import { generateTestFiles, validateParsedTest } from "../src/lib/generators/test-generator";

/**
 * CLI скрипт для парсинга baza1.txt и генерации TypeScript файлов
 */
function main() {
  const bazaPath = path.join(__dirname, "../src/tests/baza1.txt");
  
  console.log("Парсинг baza1.txt...");
  
  if (!fs.existsSync(bazaPath)) {
    console.error(`Файл не найден: ${bazaPath}`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(bazaPath, "utf-8");
  const parsedTests = parseBazaFile(content);
  
  console.log(`Найдено тестов: ${parsedTests.length}`);
  
  const testsDir = path.join(__dirname, "../src/tests");
  
  for (const test of parsedTests) {
    console.log(`\nОбработка теста: ${test.title} (${test.id})`);
    
    // Валидация (не блокируем создание, если только отсутствуют ответы)
    const validation = validateParsedTest(test);
    if (!validation.valid) {
      const criticalErrors = validation.errors.filter(e => !e.includes("не имеет правильного ответа"));
      if (criticalErrors.length > 0) {
        console.error(`Критические ошибки валидации для теста "${test.title}":`);
        criticalErrors.forEach((err) => console.error(`  - ${err}`));
        continue;
      }
      // Если только отсутствуют ответы, продолжаем с предупреждением
      console.warn(`  ⚠ Некоторые вопросы не имеют правильных ответов, но тест будет создан`);
    }
    
    // Создаем директорию для теста
    const testDir = path.join(testsDir, test.id);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Генерация файлов
    const { publicFile, answerFile } = generateTestFiles(test, testDir);
    
    // Записываем файлы
    const publicFilePath = path.join(testDir, "public.ts");
    const answerFilePath = path.join(testDir, "answer.ts");
    
    fs.writeFileSync(publicFilePath, publicFile, "utf-8");
    fs.writeFileSync(answerFilePath, answerFile, "utf-8");
    
    console.log(`  ✓ Создан public.ts (${publicFile.length} символов)`);
    console.log(`  ✓ Создан answer.ts (${answerFile.length} символов)`);
    console.log(`  ✓ Вопросов: ${test.questions.length}`);
  }
  
  console.log("\n✓ Парсинг завершен");
}

if (require.main === module) {
  main();
}
