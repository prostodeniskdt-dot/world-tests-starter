import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("leaderboard")
    .select(
      "rank,user_id,email,first_name,last_name,telegram_username,total_points,tests_completed"
    )
    .order("rank", { ascending: true })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, rows: data ?? [] });
}
