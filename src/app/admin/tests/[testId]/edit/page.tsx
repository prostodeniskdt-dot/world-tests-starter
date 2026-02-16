"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { EditTestForm } from "./EditTestForm";

type TestData = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficultyLevel: number;
  basePoints: number;
  maxAttempts: number | null;
  questions: any[];
  answerKey: Record<string, any>;
  isPublished: boolean;
};

export default function TestEditPage() {
  const params = useParams();
  const testId = params.testId as string;

  const [test, setTest] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/tests/${testId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setTest(data.test);
        else setError(data.error || "Ошибка загрузки");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [testId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error && !test) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/admin/tests" className="text-zinc-600 hover:text-zinc-900 underline">
            Назад
          </Link>
        </div>
      </div>
    );
  }

  if (!test) return null;

  return <EditTestForm test={test} setTest={setTest} testId={testId} />;
}
