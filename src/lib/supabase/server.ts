import { cookies } from "next/headers";
import { CookieOptions, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase env vars are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
    cookies: {
      get(name: string) {
        if (typeof cookieStore.get !== "function") return undefined;
        const cookie = cookieStore.get(name);
        return typeof cookie === "object" ? (cookie as { value?: string }).value : undefined;
      },
      set(name: string, value: string, options: CookieOptions) {
        if (typeof cookieStore.set !== "function") return;
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        if (typeof cookieStore.set !== "function") return;
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });
}

export function getSupabaseServiceClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase service role key is missing");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
