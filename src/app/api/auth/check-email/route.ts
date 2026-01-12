import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const checkEmailSchema = z.object({
  email: z.string().email("Невалидный email адрес"),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Невалидный JSON" },
      { status: 400 }
    );
  }

  const parsed = checkEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { 
        ok: false, 
        error: parsed.error.issues.map((i) => i.message).join(", ") 
      },
      { status: 400 }
    );
  }

  const { email } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .single();

  // PGRST116 - это код ошибки "not found" в Supabase, что нормально для проверки
  if (error && error.code !== "PGRST116") {
    console.error("Error checking email:", error);
    return NextResponse.json(
      { ok: false, error: "Ошибка проверки email" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    exists: !!user,
  });
}
