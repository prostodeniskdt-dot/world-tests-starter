# Сводка: полноценный редактор тестов

Краткое описание всех изменений по редактору тестов для переноса контекста в новый чат.

---

## Цель

Реализован полноценный редактор тестов на сайте по плану из `docs/PLAN_TEST_EDITOR.md`: создание теста без импорта, добавление/удаление/перестановка/дублирование вопросов, смена типа вопроса, редактирование полей по типам без сырого JSON, валидация перед сохранением, хлебные крошки.

---

## Изменённые и новые файлы

### 1. API: создание пустого теста

**Файл:** `src/app/api/admin/tests/route.ts`

- Разрешено создание теста с `questions: []` и `answerKey: {}`.
- Валидация: обязателен только `title`; проверка «для каждого вопроса есть ответ в answerKey» выполняется только если `questions.length > 0`.
- Вставка в БД использует `questionsArr` и `answerKeyObj` (в т.ч. пустые массивы/объекты).

### 2. Список тестов: кнопка «Создать тест»

**Файл:** `src/components/AdminTestsList.tsx`

- Импорт `useRouter` из `next/navigation`.
- Состояние `creating` и функция `createTest()`: `POST /api/admin/tests` с телом  
  `{ title: "Новый тест", description: "", category: "", difficultyLevel: 1, basePoints: 200, maxAttempts: null, questions: [], answerKey: {} }`.
- После успешного ответа: `router.push(\`/admin/tests/${data.testId}/edit\`)`.
- Кнопка «Создать тест» рядом с «Импорт JSON»; при пустом списке текст: «Создайте новый тест или импортируйте JSON».

### 3. Утилиты редактора

**Файл:** `src/lib/test-editor-utils.ts` (новый)

- `QUESTION_TYPES` — массив допустимых типов:  
  `multiple-choice`, `multiple-select`, `true-false-enhanced`, `cloze-dropdown`, `select-errors`, `matching`, `ordering`, `two-step`, `matrix`, `grouping`.
- `QUESTION_TYPE_LABELS` — русские подписи для типов.
- `defaultAnswerForType(type, question?)` — значение ответа по умолчанию для типа (число, массив, `{ answer, reason }` и т.д.).
- `normalizeQuestionByType(question, newType)` — нормализация объекта вопроса при смене типа (оставляет `id`, `text`, `hint`; дополняет поля по типу).
- `createDefaultQuestion(existingIds: Set<string>)` — генерация уникального `id` (например `q${Date.now()}`) и дефолтного вопроса `multiple-choice` с пустыми `options`.
- `validateTestForSave(test)` — клиентская валидация: `title`, непустой массив вопросов, у каждого — `id`, `type`, `text`; для каждого `q.id` есть ключ в `answerKey`; проверки по типу (options, gaps, reasons и т.д.). Возвращает `ValidationError[]` (`field`, `message`).

### 4. Страница редактирования теста (упрощённая)

**Файл:** `src/app/admin/tests/[testId]/edit/page.tsx`

- Только загрузка теста и ранние выходы:
  - `useState` для `test`, `loading`, `error`;
  - `useEffect`: `GET /api/admin/tests/${testId}`, при успехе — `setTest(data.test)`.
  - Если `loading` — спиннер.
  - Если `error && !test` — сообщение и ссылка «Назад».
  - Если `!test` — `return null`.
- Итоговый рендер:  
  `<EditTestForm test={test} setTest={setTest} testId={testId} />`.

Причина упрощения: в одном большом файле парсер (SWC/Next.js) давал ошибку «Unexpected token `div`. Expected jsx identifier» на третьем по счёту `return ( <div ...>` в том же компоненте. Форму вынесли в отдельный компонент.

### 5. Компонент формы редактора

**Файл:** `src/app/admin/tests/[testId]/edit/EditTestForm.tsx` (новый)

Принимает пропсы: `test`, `setTest`, `testId`.

- Локальное состояние: `saving`, `error`, `saveMessage`, `validationErrors`, `expandedQuestions` (массив индексов развёрнутых вопросов).
- Обновления теста через `setTest` (в т.ч. `setTest(prev => ...)` для answerKey при смене id вопроса).

Реализовано:

- Хлебные крошки: Админка → Тесты → Редактирование: «{название}».
- Ссылка «Назад к тестам», заголовок, кнопки «Превью» и «Сохранить».
- Блок метаданных: название, ID (readonly), описание, категория, сложность (1–3), базовые очки, макс. попыток.
- Блок «Вопросы»:
  - Кнопка «Добавить вопрос» — вызывается `createDefaultQuestion`, в тест добавляется вопрос и запись в `answerKey`, новый вопрос разворачивается.
  - Список вопросов: коллапс по клику; у каждого — кнопки «Вверх», «Вниз», «Дублировать»; внутри развёрнутого — поля по типу.
- У каждого вопроса в форме:
  - ID вопроса (при смене id синхронно переименовывается ключ в `answerKey`).
  - Выпадающий список «Тип вопроса» (из `QUESTION_TYPES`); при смене — `setQuestionType(idx, newType)` (нормализация + дефолтный ответ).
  - Текст вопроса, подсказка (hint).
  - По типу:
    - **multiple-choice**: варианты (textarea по строкам), правильный ответ — select по индексу.
    - **multiple-select**: варианты, правильный ответ — чекбоксы по индексам.
    - **true-false-enhanced**: утверждение (statement), причины (textarea по строкам), «Верно/Неверно» + select причины (индекс).
    - **cloze-dropdown**: подсказка про [1], [2]; массив пропусков (gaps) с кнопками «+ Добавить пропуск» / «Удалить пропуск»; у каждого пропуска — варианты и select правильного индекса.
    - **matching**: leftItems и rightItems (textarea по строкам); для каждого левого — select «правый индекс» (answerKey как `[number, number][]`).
    - **ordering**: items (textarea по строкам), правильный порядок — строка индексов через запятую (answerKey — `number[]`).
    - Остальные типы: одно поле «Правильный ответ (JSON)».
  - Кнопка «Удалить вопрос».
- Перед сохранением вызывается `validateTestForSave(test)`; при наличии ошибок они показываются списком и PUT не отправляется.
- Сохранение: `PUT /api/admin/tests/${testId}` с телом `{ title, description, category, difficultyLevel, basePoints, maxAttempts, questions, answerKey }`.

---

## Поведение по сценариям

1. **Создать тест без импорта:** в списке тестов «Создать тест» → POST с пустыми questions/answerKey → редирект на редактирование; в редакторе 0 вопросов, можно добавлять.
2. **Добавить вопрос:** «Добавить вопрос» → новый вопрос с уникальным id и типом multiple-choice, развёрнут; в answerKey добавлен ключ с значением 0.
3. **Сменить тип вопроса:** выбор в select → нормализация полей вопроса и дефолтный ответ в answerKey.
4. **Редактировать ответ без JSON:** для multiple-choice, multiple-select, true-false-enhanced, cloze, matching, ordering — только UI (select/checkbox/поля), ответ пишется в answerKey в нужном формате.
5. **Переставить вопросы:** кнопки «Вверх»/«Вниз» меняют порядок в `test.questions` и при необходимости индексы в `expandedQuestions`.
6. **Дублировать вопрос:** копия вопроса с новым id и тем же значением в answerKey, вставка сразу после текущего, новый вопрос развёрнут.
7. **Сохранить:** валидация → при ошибках показ списка; при успехе — PUT и сообщение «Сохранено!».

---

## Важно для дальнейшей работы

- Полный план по шагам: `docs/PLAN_TEST_EDITOR.md`.
- Спецификация JSON для импорта (и для агента): `docs/IMPORT_JSON_SPEC.md`; пример валидного JSON: `docs/import-format-example.json`.
- Типы вопросов и форматы ответов: `src/tests/types.ts`, проверка ответов — `src/lib/answer-checkers.ts`.
- Редактор не трогает импорт: импорт по-прежнему через `/admin/tests/import` и свою валидацию (`validateTestJson` в `import/page.tsx`).

Если в новом чате понадобится доработать редактор (новые типы вопросов, автосохранение, drag-and-drop и т.д.), этой сводки и указанных файлов достаточно для продолжения.
