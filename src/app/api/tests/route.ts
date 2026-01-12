import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const { data: tests, error } = await supabaseAdmin
    .from("tests")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, tests: tests || [] });
}
