"use client";

import { useSearchParams } from "next/navigation";
import { TestClient } from "@/components/TestClient";
import { LoginModal } from "@/components/LoginModal";
import { useLocalUser } from "@/components/UserGate";
import { useEffect, useState } from "react";

type PublicTest = {
  id: string;
  title: string;
  description: string | null;
  questions: Array<{
    id: string;
    text: string;
    options: string[];
  }>;
};

export default function TestPage() {
  const { user } = useLocalUser();
  const searchParams = useSearchParams();
  const testId = searchParams.get("testId");
  const [test, setTest] = useState<PublicTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!testId) {
      setError("Тест не указан");
      setLoading(false);
      return;
    }

    fetch(`/api/tests/${testId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.test) {
          setTest(data.test);
        } else {
          setError(data.error || "Тест не найден");
        }
      })
      .catch(() => setError("Ошибка загрузки теста"))
      .finally(() => setLoading(false));
  }, [testId]);

  if (!user) {
    return (
      <>
        <LoginModal />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-4">Доступ к тесту ограничен</h1>
            <p className="text-zinc-600">
              Пожалуйста, зарегистрируйтесь для прохождения теста
            </p>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-20">
          <div className="text-zinc-600">Загрузка теста...</div>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold mb-4">Ошибка</h1>
          <p className="text-zinc-600">{error || "Тест не найден"}</p>
        </div>
      </div>
    );
  }

  return <TestClient test={test} />;
}
