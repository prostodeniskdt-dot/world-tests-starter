"use client";

import { TEST_1_PUBLIC } from "@/tests/test-1.public";
import { TestClient } from "@/components/TestClient";
import { LoginModal } from "@/components/LoginModal";
import { useLocalUser } from "@/components/UserGate";

export default function TestPage() {
  const { user } = useLocalUser();

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

  return <TestClient test={TEST_1_PUBLIC} />;
}
