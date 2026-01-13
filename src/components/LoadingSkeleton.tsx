export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
      <div className="h-4 bg-zinc-200 rounded w-1/2"></div>
      <div className="h-4 bg-zinc-200 rounded w-5/6"></div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-10 bg-zinc-200 rounded w-12"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-zinc-200 rounded w-1/3"></div>
            <div className="h-3 bg-zinc-200 rounded w-1/4"></div>
          </div>
          <div className="h-4 bg-zinc-200 rounded w-16"></div>
        </div>
      ))}
    </div>
  );
}
