import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from("leaderboard")
    .select("*", { count: "exact" })
    .order("rank", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  const totalPages = count ? Math.ceil(count / limit) : 1;

  return NextResponse.json({
    ok: true,
    rows: data ?? [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages,
    },
  });
}
