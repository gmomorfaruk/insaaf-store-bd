import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Result type for API guard checks so callers can return a response early.
type AdminCheckResult =
  | { ok: true; user: User }
  | { ok: false; response: NextResponse };

// Determine whether a Supabase user should be treated as an admin.
function isAdminUser(user: User) {
  // Option 1: role in Supabase auth metadata (recommended for production).
  const role =
    (typeof user.app_metadata?.role === "string" && user.app_metadata.role) ||
    (typeof user.user_metadata?.role === "string" && user.user_metadata.role) ||
    "";
  if (role.toLowerCase() === "admin") return true;

  // Option 2: email allowlist via env var ADMIN_EMAILS (comma-separated).
  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  
  const email = (user.email ?? "").toLowerCase();
  if (allowlist.length && Boolean(email) && allowlist.includes(email)) return true;

  // Fallback: If no admin configuration exists (no ADMIN_EMAILS and no role metadata),
  // treat any authenticated user as admin. This allows the system to work
  // during development. In production, set ADMIN_EMAILS or configure user roles.
  if (!allowlist.length && !role) return true;

  return false;
}

// Shared admin guard for API routes that mutate or reveal sensitive data.
export async function requireAdminUser(): Promise<AdminCheckResult> {
  // Reads the Supabase user from request cookies (server-side).
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  // Authenticated but not authorized as admin.
  if (!isAdminUser(user)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true, user };
}
