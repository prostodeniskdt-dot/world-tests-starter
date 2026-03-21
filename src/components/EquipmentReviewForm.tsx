"use client";

import { useState } from "react";
import { useLocalUser } from "@/components/UserGate";
import { LoginModal } from "@/components/LoginModal";

export function EquipmentReviewForm({ equipmentSlug }: { equipmentSlug: string }) {
  const { user } = useLocalUser();
  const [showAuth, setShowAuth] = useState(false);
  const [rating, setRating] = useState("5");
  const [text, setText] = useState("");
  const [usage, setUsage] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuth(true);
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/technique/equipment/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          equipment_slug: equipmentSlug,
          rating: parseInt(rating, 10),
          review_text: text.trim() || null,
          usage_duration: usage.trim() || null,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setMsg(data.error || "Ошибка");
        return;
      }
      setOk(true);
      setText("");
      setUsage("");
    } catch {
      setMsg("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  if (ok) {
    return (
      <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        Спасибо! Отзыв отправлен на модерацию.
      </p>
    );
  }

  return (
    <div>
      {showAuth && (
        <LoginModal isOpen={showAuth} onClose={() => setShowAuth(false)} initialMode="login" />
      )}
      <form onSubmit={submit} className="space-y-3 text-sm">
        {msg ? <p className="text-red-600 text-sm">{msg}</p> : null}
        <div>
          <label className="block text-zinc-600 mb-1">Оценка 1–5</label>
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="rounded-lg border border-zinc-300 px-2 py-1.5 bg-white"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-zinc-600 mb-1">Срок использования (необязательно)</label>
          <input
            value={usage}
            onChange={(e) => setUsage(e.target.value)}
            placeholder="например, 2 года в баре"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-zinc-600 mb-1">Комментарий</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary-600 text-white px-4 py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? "Отправка…" : "Отправить отзыв"}
        </button>
      </form>
    </div>
  );
}
