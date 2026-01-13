import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/admin-middleware";
import { z } from "zod";

const banSchema = z.object({
  banned: z.boolean(),
  bannedUntil: z.string().optional().nullable(), // ISO date string или null для постоянного бана
});

export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  // Проверяем админские права
  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  const { userId } = params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Невалидный JSON" },
      { status: 400 }
    );
  }

  const parsed = banSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const { banned, bannedUntil } = parsed.data;

  // Проверяем, что пользователь существует
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, email, is_admin")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    return NextResponse.json(
      { ok: false, error: "Пользователь не найден" },
      { status: 404 }
    );
  }

  // Нельзя забанить другого админа
  if (user.is_admin && banned) {
    return NextResponse.json(
      { ok: false, error: "Нельзя забанить администратора" },
      { status: 403 }
    );
  }

  // Обновляем статус бана
  const updateData: {
    is_banned: boolean;
    banned_until?: string | null;
  } = {
    is_banned: banned,
  };

  if (banned) {
    updateData.banned_until = bannedUntil || null;
  } else {
    updateData.banned_until = null;
  }

  const { data: updatedUser, error: updateError } = await supabaseAdmin
    .from("users")
    .update(updateData)
    .eq("id", userId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { ok: false, error: "Ошибка обновления: " + updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      isBanned: updatedUser.is_banned,
      bannedUntil: updatedUser.banned_until,
    },
  });
}
