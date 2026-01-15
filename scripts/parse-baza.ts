import * as fs from "fs";
import * as path from "path";
import { parseBazaFile } from "../src/lib/parsers/baza-parser";
import { generateTestFiles, validateParsedTest } from "../src/lib/generators/test-generator";

/**
 * CLI скрипт для парсинга baza.txt и генерации TypeScript файлов
 */
function main() {
  const bazaPath = path.join(__dirname, "../src/tests/baza.txt");
  
  console.log("Парсинг baza.txt...");
  
  if (!fs.existsSync(bazaPath)) {
    console.error(`Файл не найден: ${bazaPath}`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(bazaPath, "utf-8");
  const parsedTests = parseBazaFile(content);
  
  console.log(`Найдено тестов: ${parsedTests.length}`);
  
  for (const test of parsedTests) {
    console.log(`\nОбработка теста: ${test.title}`);
    
    // Валидация
    const validation = validateParsedTest(test);
    if (!validation.valid) {
      console.error(`Ошибки валидации для теста "${test.title}":`);
      validation.errors.forEach((err) => console.error(`  - ${err}`));
      continue;
    }
    
    // Генерация файлов
    const { publicFile, answerFile } = generateTestFiles(test, "");
    
    // Вывод результатов (в реальности здесь можно записать в файлы)
    console.log(`  ✓ Сгенерирован public.ts (${publicFile.length} символов)`);
    console.log(`  ✓ Сгенерирован answer.ts (${answerFile.length} символов)`);
    console.log(`  ✓ Вопросов: ${test.questions.length}`);
    
    // В реальной реализации здесь нужно:
    // 1. Создать папку для теста (если не существует)
    // 2. Записать publicFile в public.ts
    // 3. Записать answerFile в answer.ts
    // 4. Обновить tests-registry.ts
  }
  
  console.log("\n✓ Парсинг завершен");
  console.log("\nПримечание: Для сохранения файлов нужно добавить логику записи в файловую систему");
}

if (require.main === module) {
  main();
}
