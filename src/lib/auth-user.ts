import "server-only";
import { db } from "@/lib/db";

export type UserAuthState = {
  isAdmin: boolean;
  isBanned: boolean;
  consentPublicRating: boolean;
};

export async function getUserAuthState(userId: string): Promise<UserAuthState | null> {
  const { rows } = await db.query(
    `SELECT is_admin, is_banned, consent_public_rating FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );
  const row = rows[0];
  if (!row) return null;

  return {
    isAdmin: Boolean(row.is_admin),
    isBanned: Boolean(row.is_banned),
    consentPublicRating: Boolean(row.consent_public_rating),
  };
}
