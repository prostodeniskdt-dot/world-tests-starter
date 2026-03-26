"use client";

import { useRouter } from "next/navigation";
import { PrepForm } from "@/components/PrepForm";

type Category = { id: number; name: string };

export function AdminPrepEditForm({
  initial,
  categories,
  mode,
}: {
  initial?: Record<string, unknown>;
  categories: Category[];
  mode: "create" | "edit";
}) {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <PrepForm
        mode="admin"
        categories={categories}
        initial={initial ?? null}
        uploadEndpoint="/api/preps/upload-image"
        submitLabel={mode === "edit" ? "Сохранить" : "Создать"}
        onSubmit={async (payload) => {
          const url = mode === "edit" ? `/api/admin/preps/${initial?.id}` : "/api/admin/preps";
          const method = mode === "edit" ? "PUT" : "POST";
          const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const json = await res.json();
          if (json?.ok && mode === "create" && json?.id) {
            router.push(`/admin/preps/${json.id}/edit`);
          }
          return json;
        }}
      />

      {mode === "edit" && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={async () => {
              if (!confirm("Удалить заготовку? Это действие нельзя отменить.")) return;
              const res = await fetch(`/api/admin/preps/${initial?.id}`, { method: "DELETE" });
              const json = await res.json();
              if (json?.ok) router.push("/admin/preps");
              else alert(json?.error || "Ошибка удаления");
            }}
            className="text-sm text-red-600 hover:underline"
          >
            Удалить заготовку
          </button>
        </div>
      )}
    </div>
  );
}

