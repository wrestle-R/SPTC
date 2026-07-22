"use client";

import { createClient } from "@supabase/supabase-js";

function requiredEnv(name: string, value: string | undefined) {
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

export const supabase = createClient(
  requiredEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  requiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
);
