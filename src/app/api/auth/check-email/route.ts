import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

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

  try {
    const { rows } = await db.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [normalizedEmail]
    );

    return NextResponse.json({
      ok: true,
      exists: rows.length > 0,
    });
  } catch (err: any) {
    console.error("Error checking email:", err);
    return NextResponse.json(
      { ok: false, error: "Ошибка проверки email" },
      { status: 500 }
    );
  }
}
