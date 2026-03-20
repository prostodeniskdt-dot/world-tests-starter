"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import Link from "next/link";

type GameState = "loading" | "playing" | "result";

type Question = {
  mainIngredient: string;
  correct: string[];
  options: string[];
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function PairingsGamePage() {
  const [state, setState] = useState<GameState>("loading");
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [questionNum, setQuestionNum] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const TOTAL_QUESTIONS = 10;
  const CORRECT_IN_OPTIONS = 4;
  const WRONG_IN_OPTIONS = 2;

  const loadQuestion = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/flavor-pairings?random=1");
      const data = await res.json();
      if (!data.ok || !data.pairedIngredients) {
        setQuestion(null);
        setState("playing");
        return;
      }

      const correctList = data.pairedIngredients as string[];
      const correct = shuffle(correctList).slice(0, CORRECT_IN_OPTIONS);

      const listRes = await fetch("/api/flavor-pairings?list=1");
      const listData = await listRes.json();
      const allIngredients = (listData.ingredients ?? []) as string[];
      const exclude = new Set([
        data.mainIngredient,
        ...correct,
        ...correctList,
      ]);
      const wrongPool = allIngredients.filter((i) => !exclude.has(i));
      const wrong = shuffle(wrongPool).slice(0, WRONG_IN_OPTIONS);

      const options = shuffle([...correct, ...wrong]);
      setQuestion({
        mainIngredient: data.mainIngredient,
        correct,
        options,
      });
      setSelected(new Set());
      setState("playing");
    } catch {
      setQuestion(null);
      setState("playing");
    }
  };

  useEffect(() => {
    loadQuestion();
  }, []);

  const toggleOption = (opt: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  };

  const checkAnswer = () => {
    if (!question) return;
    const selectedCorrect = question.correct.filter((c) => selected.has(c));
    const selectedWrong = [...selected].filter(
      (s) => !question.correct.includes(s)
    );
    if (selectedCorrect.length === question.correct.length && selectedWrong.length === 0) {
      setScore((s) => s + 10);
      setCorrectCount((c) => c + 1);
    }
    setState("result");
  };

  const nextQuestion = () => {
    setQuestionNum((n) => n + 1);
    if (questionNum + 1 >= TOTAL_QUESTIONS) {
      setState("loading");
      loadQuestion();
      setQuestionNum(0);
    } else {
      loadQuestion();
    }
  };

  const isCorrect = (opt: string) =>
    question?.correct.includes(opt) ?? false;
  const isWrong = (opt: string) =>
    question && !question.correct.includes(opt);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/pairings"
        className="text-sm text-primary-600 hover:underline mb-6 inline-block"
      >
        ← Сочетания
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
          Угадай пару
        </h1>
        <p className="text-zinc-600 leading-relaxed">
          Выбери ингредиенты, которые сочетаются с основным. Нажми «Проверить»,
          когда будешь готов.
        </p>
      </div>

      <div className="flex justify-between items-center mb-6 rounded-xl border border-zinc-200 bg-white p-4">
        <span className="font-bold text-zinc-900">Счёт: {score}</span>
        <span className="text-zinc-600">
          Вопрос: {questionNum + 1} / {TOTAL_QUESTIONS}
        </span>
      </div>

      {state === "loading" && (
        <div className="rounded-xl border-2 border-zinc-200 bg-white p-12 text-center text-zinc-500">
          Загрузка вопроса...
        </div>
      )}

      {state === "playing" && question && (
        <div className="rounded-xl border-2 border-zinc-200 bg-white shadow-soft overflow-hidden">
          <div className="bg-primary-50 border-b border-primary-200 px-6 py-4">
            <h2 className="text-xl font-bold text-zinc-900">
              Что сочетается с <strong>{question.mainIngredient}</strong>?
            </h2>
            <p className="text-sm text-zinc-600 mt-1">
              Выбери все верные варианты ({question.correct.length} из{" "}
              {question.options.length})
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {question.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => toggleOption(opt)}
                  className={`rounded-xl border-2 p-4 text-center font-medium transition-all ${
                    selected.has(opt)
                      ? "border-primary-500 bg-primary-100 text-primary-900"
                      : "border-zinc-200 bg-white hover:border-primary-300 hover:bg-zinc-50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <button
              onClick={checkAnswer}
              className="w-full rounded-lg gradient-primary px-6 py-3 text-base font-semibold text-white hover:opacity-90 shadow-md"
            >
              Проверить
            </button>
          </div>
        </div>
      )}

      {state === "result" && question && (
        <div className="rounded-xl border-2 border-zinc-200 bg-white shadow-soft overflow-hidden">
          <div className="bg-primary-50 border-b border-primary-200 px-6 py-4">
            <h2 className="text-xl font-bold text-zinc-900">
              Результат: {question.mainIngredient}
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {question.options.map((opt) => {
                const correct = isCorrect(opt);
                const wrong = isWrong(opt) && selected.has(opt);
                let bg = "bg-white border-zinc-200";
                if (correct) bg = "bg-emerald-100 border-emerald-400";
                else if (wrong) bg = "bg-red-100 border-red-400";
                return (
                  <div
                    key={opt}
                    className={`rounded-xl border-2 p-4 text-center font-medium ${bg}`}
                  >
                    {opt}
                    {correct && (
                      <span className="ml-1 text-emerald-600" aria-hidden>✓</span>
                    )}
                    {wrong && (
                      <span className="ml-1 text-red-600" aria-hidden>✗</span>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              onClick={nextQuestion}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg gradient-primary px-6 py-3 text-base font-semibold text-white hover:opacity-90 shadow-md"
            >
              <RefreshCw className="h-5 w-5" />
              {questionNum + 1 >= TOTAL_QUESTIONS ? "Начать заново" : "Следующий вопрос"}
            </button>
          </div>
        </div>
      )}

      {!question && state === "playing" && (
        <div className="rounded-xl border-2 border-zinc-200 bg-white p-12 text-center text-zinc-500">
          Не удалось загрузить вопрос.{" "}
          <button
            onClick={loadQuestion}
            className="text-primary-600 hover:underline"
          >
            Попробовать снова
          </button>
        </div>
      )}
    </div>
  );
}
