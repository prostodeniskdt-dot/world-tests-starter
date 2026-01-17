import "server-only";

/**
 * ВНИМАНИЕ:
 * Этот файл нельзя импортировать в клиентские компоненты,
 * иначе правильные ответы утекут в браузер.
 */

export const CARBONIZATION_ADVANCED_3_SECRET = {
  id: "carbonization-advanced-3",
  basePoints: 200,
  difficulty: 2,
  maxAttempts: null as number | null,
  answerKey: {
    q1: 0, // multiple-choice: Увеличить контакт
    q2: {"step1":0,"step2":0}, // two-step: "Часть CO₂ выходит" -> "Падение давления..."
    q3: [4], // select-errors: id=4 "Поднять температуру" - противоречит hint (тепло снижает растворимость)
    q4: {0:0, 1:1, 2:2}, // matrix: Сахар->вязкость, Кислотность->формы, Агитация->контакт
    q5: [0,2], // multiple-select: Меньшие поры + обслуживание
    q6: [0,1,2,3], // ordering: охладить, подать CO₂, агитация, санитизация
    q7: 0, // multiple-choice: Сдвиг форм угольной кислоты
    q8: [[0,2],[1,1],[2,0],[3,3]], // matching: подход->механизм
    q9: {"Физика растворения":[0,1,4], "Обслуживание инструмента":[2,3]}, // grouping
    q10: 0, // multiple-choice: Парциальное давление
    q11: {answer: true, reason: 0}, // true-false-enhanced: Верно, диффузия ускоряется
    q12: [0], // cloze-dropdown: формы угольной кислоты
    q13: 0, // multiple-choice: Недостаточная регулярная очистка
    q14: [0,1,2,3], // ordering: давление, агитация, поры, трещины
    q15: [[0,0],[1,1],[2,2],[3,3]], // matching: фактор->ошибка мышления
    q16: [0,2], // multiple-select: вязкость + конкуренция за воду
    q17: {answer: false, reason: 0}, // true-false-enhanced: Ложь, меньше поры = медленнее
    q18: [0], // cloze-dropdown: доле (концентрации)
    q19: {"Влияет на равновесие":[0,1], "Влияет на скорость":[2,3,4]}, // grouping
    q20: 0, // multiple-choice: опоры взаимосвязаны
  } as Record<string, any>,
};
