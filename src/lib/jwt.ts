import jwt, { SignOptions } from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "7d";

export type JWTPayload = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  telegramUsername?: string | null;
  isAdmin: boolean;
  isBanned: boolean;
};

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}
