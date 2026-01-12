import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // Токен действителен 1 час

  await supabaseAdmin.from("password_reset_tokens").insert({
    user_id: userId,
    token,
    expires_at: expiresAt.toISOString(),
  });

  return token;
}

export async function validatePasswordResetToken(token: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("password_reset_tokens")
    .select("user_id, expires_at, used")
    .eq("token", token)
    .eq("used", false)
    .single();

  if (error || !data) return null;

  const expiresAt = new Date(data.expires_at);
  if (expiresAt < new Date()) return null;

  return data.user_id;
}

export async function markTokenAsUsed(token: string): Promise<void> {
  await supabaseAdmin
    .from("password_reset_tokens")
    .update({ used: true })
    .eq("token", token);
}
