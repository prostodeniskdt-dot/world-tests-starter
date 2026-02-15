import crypto from "crypto";
import { db } from "@/lib/db";

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // Токен действителен 1 час

  await db.query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [userId, token, expiresAt.toISOString()]
  );

  return token;
}

export async function validatePasswordResetToken(token: string): Promise<string | null> {
  const { rows } = await db.query(
    `SELECT user_id, expires_at, used FROM password_reset_tokens WHERE token = $1 AND used = false LIMIT 1`,
    [token]
  );

  if (rows.length === 0) return null;

  const row = rows[0];
  const expiresAt = new Date(row.expires_at);
  if (expiresAt < new Date()) return null;

  return row.user_id;
}

export async function markTokenAsUsed(token: string): Promise<void> {
  await db.query(
    `UPDATE password_reset_tokens SET used = true WHERE token = $1`,
    [token]
  );
}
