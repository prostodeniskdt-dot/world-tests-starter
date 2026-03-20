"use client";

import { useState } from "react";

type Submission = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: string;
  created_at: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

export function AdminSubmissionsList({ submissions }: { submissions: Submission[] }) {
  const [items, setItems] = useState(submissions);
  const [processing, setProcessing] = useState<number | null>(null);

  const handleApprove = async (id: number) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/knowledge/submissions/${id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.ok) {
        setItems((prev) => prev.filter((s) => s.id !== id));
      }
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: number) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/knowledge/submissions/${id}/reject`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.ok) {
        setItems((prev) => prev.filter((s) => s.id !== id));
      }
    } finally {
      setProcessing(null);
    }
  };

  const pending = items.filter((s) => s.status === "pending");
  const others = items.filter((s) => s.status !== "pending");

  return (
    <div className="space-y-6">
      {pending.length === 0 && others.length === 0 ? (
        <p className="text-zinc-500">Нет заявок</p>
      ) : (
        <>
          {pending.length > 0 && (
            <div>
              <h2 className="font-semibold text-zinc-900 mb-3">
                Ожидают модерации ({pending.length})
              </h2>
              <div className="space-y-4">
                {pending.map((s) => (
                  <SubmissionCard
                    key={s.id}
                    s={s}
                    onApprove={() => handleApprove(s.id)}
                    onReject={() => handleReject(s.id)}
                    processing={processing === s.id}
                  />
                ))}
              </div>
            </div>
          )}
          {others.length > 0 && (
            <div>
              <h2 className="font-semibold text-zinc-900 mb-3">Обработанные</h2>
              <div className="space-y-4">
                {others.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-zinc-200 bg-white p-4 opacity-75"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{s.title}</span>
                      <span
                        className={`text-sm ${
                          s.status === "approved" ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {s.status === "approved" ? "Одобрено" : "Отклонено"}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 mt-1">
                      {new Date(s.created_at).toLocaleString("ru-RU")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SubmissionCard({
  s,
  onApprove,
  onReject,
  processing,
}: {
  s: Submission;
  onApprove: () => void;
  onReject: () => void;
  processing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const author = [s.first_name, s.last_name].filter(Boolean).join(" ") || s.email || "—";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-zinc-900">{s.title}</h3>
          <p className="text-sm text-zinc-500 mt-1">Автор: {author}</p>
          <p className="text-xs text-zinc-400 mt-1">
            {new Date(s.created_at).toLocaleString("ru-RU")}
          </p>
          {s.excerpt && (
            <p className="text-sm text-zinc-600 mt-2 line-clamp-2">{s.excerpt}</p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onApprove}
            disabled={processing}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            Одобрить
          </button>
          <button
            onClick={onReject}
            disabled={processing}
            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            Отклонить
          </button>
        </div>
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 text-sm text-primary-600 hover:underline"
      >
        {expanded ? "Свернуть" : "Показать содержание"}
      </button>
      {expanded && (
        <div
          className="mt-3 p-3 bg-zinc-50 rounded-lg text-sm text-zinc-700 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: s.content }}
        />
      )}
    </div>
  );
}
