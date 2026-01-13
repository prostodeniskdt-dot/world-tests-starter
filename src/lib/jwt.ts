import jwt, { SignOptions } from "jsonwebtoken";

// Явно типизируем как string, гарантируя что значение всегда будет строкой
const JWT_SECRET: string = process.env.JWT_SECRET || "your-secret-key-change-in-production";
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
  // Используем приведение типа для expiresIn, так как StringValue - это специальный тип из ms
  // который представляет строки времени (например, "7d", "1h", "30m")
  // Используем приведение типа для обхода строгой проверки TypeScript в строгом режиме
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}
