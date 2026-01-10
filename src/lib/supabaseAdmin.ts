import "server-only";
import { createClient } from "@supabase/supabase-js";

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing env var ${name}. Add it to .env.local (local) or Vercel project settings.`
    );
  }
  return v;
}

export const supabaseAdmin = createClient(
  required("SUPABASE_URL"),
  required("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: { persistSession: false },
  }
);
