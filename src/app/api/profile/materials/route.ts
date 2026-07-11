import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import {
  getUserContributions,
  type ContributionStatus,
} from "@/lib/user-contributions";

const ALLOWED_STATUSES = new Set<ContributionStatus>([
  "pending",
  "approved",
  "rejected",
]);

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const statusParam = request.nextUrl.searchParams.get("status");
  const kindParam = request.nextUrl.searchParams.get("kind")?.trim();
  const requestedPage = Number.parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
  const requestedLimit = Number.parseInt(request.nextUrl.searchParams.get("limit") || "20", 10);
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(50, Math.max(1, requestedLimit))
    : 20;

  try {
    const result = await getUserContributions(auth.userId);
    const status =
      statusParam && ALLOWED_STATUSES.has(statusParam as ContributionStatus)
        ? (statusParam as ContributionStatus)
        : null;
    const filtered = result.items.filter(
      (item) =>
        (!status || item.status === status) &&
        (!kindParam || item.kind === kindParam)
    );
    const offset = (page - 1) * limit;

    return NextResponse.json({
      ok: true,
      items: filtered.slice(offset, offset + limit),
      unavailableKinds: result.unavailableKinds,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      },
    });
  } catch (error) {
    console.error("Profile materials error:", error);
    return NextResponse.json(
      { ok: false, error: "Не удалось загрузить материалы" },
      { status: 500 }
    );
  }
}
