const MIN_JWT_SECRET_LENGTH = 32;
const PLACEHOLDER_SECRET = "your-secret-key-change-in-production";

let cachedSecret: string | null = null;
let cachedEnvValue: string | undefined;

/** JWT secret — lazy validation so `next build` works without env at compile time. */
export function getJwtSecret(): string {
  const value = process.env.JWT_SECRET?.trim();

  if (cachedSecret && cachedEnvValue === value) {
    return cachedSecret;
  }

  if (!value) {
    throw new Error(
      "Missing JWT_SECRET. Set a random string of at least 32 characters in .env.local or hosting settings."
    );
  }
  if (value.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters.`
    );
  }
  if (value === PLACEHOLDER_SECRET) {
    throw new Error("JWT_SECRET must not use the default placeholder value.");
  }

  cachedSecret = value;
  cachedEnvValue = value;
  return cachedSecret;
}
