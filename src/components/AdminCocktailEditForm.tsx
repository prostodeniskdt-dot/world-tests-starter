"use client";

import { useRouter } from "next/navigation";
type Category = { id: number; name: string };
import { CocktailForm } from "@/components/CocktailForm";

export function AdminCocktailEditForm({
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
      <CocktailForm
        mode="admin"
        categories={categories}
        initial={initial ?? null}
        uploadEndpoint="/api/upload"
        submitLabel={mode === "edit" ? "Сохранить" : "Создать"}
        onSubmit={async (payload) => {
          const url =
            mode === "edit" ? `/api/admin/cocktails/${initial?.id}` : "/api/admin/cocktails";
          const method = mode === "edit" ? "PUT" : "POST";
          const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const json = await res.json();
          if (json?.ok && mode === "create" && json?.id) {
            router.push(`/admin/cocktails/${json.id}/edit`);
          }
          return json;
        }}
      />

      {mode === "edit" && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={async () => {
              if (!confirm("Удалить коктейль? Это действие нельзя отменить.")) return;
              const res = await fetch(`/api/admin/cocktails/${initial?.id}`, { method: "DELETE" });
              const json = await res.json();
              if (json?.ok) router.push("/admin/cocktails");
              else alert(json?.error || "Ошибка удаления");
            }}
            className="text-sm text-red-600 hover:underline"
          >
            Удалить коктейль
          </button>
        </div>
      )}
    </div>
  );
}
