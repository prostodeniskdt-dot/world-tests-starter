import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, checkEmailRateLimiter } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/request";

const checkEmailSchema = z.object({
  email: z.string().email("Невалидный email адрес"),
});

/** Deprecated: email uniqueness is validated on register. Kept for backward compatibility. */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rateLimit = await checkRateLimit(checkEmailRateLimiter, ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Слишком много запросов. Попробуйте позже." },
      { status: 429 }
    );
  }

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
        error: parsed.error.issues.map((i) => i.message).join(", "),
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
