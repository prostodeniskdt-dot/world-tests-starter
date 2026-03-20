import { type LucideIcon } from "lucide-react";

type CatalogEmptyProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function CatalogEmpty({ title, description, icon: Icon }: CatalogEmptyProps) {
  return (
    <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-white p-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
        <Icon className="h-8 w-8 text-zinc-400" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="mt-2 text-sm text-zinc-600 max-w-md mx-auto">{description}</p>
    </div>
  );
}
