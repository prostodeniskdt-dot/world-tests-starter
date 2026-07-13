import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken, type JWTPayload } from "@/lib/jwt";
import { getUserAuthState } from "@/lib/auth-user";

export type ServerAuth = {
  userId: string;
  payload: JWTPayload;
  isAdmin: boolean;
  isBanned: boolean;
};

/** Authenticated user with fresh is_admin / is_banned from the database. */
export async function getServerAuth(): Promise<ServerAuth | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const state = await getUserAuthState(payload.userId);
  if (!state || state.isBanned) return null;

  return {
    userId: payload.userId,
    payload,
    isAdmin: state.isAdmin,
    isBanned: state.isBanned,
  };
}

/** Protect admin server pages — redirects home if not admin or banned. */
export async function requireServerAdmin(): Promise<{ userId: string }> {
  const auth = await getServerAuth();
  if (!auth?.isAdmin) {
    redirect("/");
  }
  return { userId: auth.userId };
}
