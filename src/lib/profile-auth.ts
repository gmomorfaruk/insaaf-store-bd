import crypto from "crypto";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

const SESSION_COOKIE = "profile_session";
const SESSION_TTL_DAYS = 30;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [algo, saltHex, hashHex] = stored.split("$");
  if (algo !== "scrypt" || !saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const derived = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hashHex, "hex"), derived);
}

export async function createProfileSession(profileId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("profile_sessions").insert({
    profile_id: profileId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });
  if (error) throw error;
  return { token, expiresAt };
}

export async function clearProfileSession(token?: string) {
  if (!token) return;
  const supabase = getSupabaseServiceClient();
  await supabase.from("profile_sessions").delete().eq("token_hash", hashToken(token));
}

export async function getProfileFromSession() {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const supabase = getSupabaseServiceClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("profile_sessions")
    .select("profile_id, expires_at, profiles:profiles(id, profile_number, full_name, email, mobile, created_at)")
    .eq("token_hash", hashToken(token))
    .gt("expires_at", nowIso)
    .maybeSingle();
  if (error || !data?.profiles) return null;
  // Handle both array and object response from Supabase join
  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  return profile ?? null;
}

function readCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (part.startsWith(`${name}=`)) {
      return decodeURIComponent(part.slice(name.length + 1));
    }
  }
  return null;
}

export async function getProfileFromRequest(req: Request) {
  const token = readCookieValue(req.headers.get("cookie"), SESSION_COOKIE);
  if (!token) return null;
  const supabase = getSupabaseServiceClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("profile_sessions")
    .select("profile_id, expires_at, profiles:profiles(id, profile_number, full_name, email, mobile, created_at)")
    .eq("token_hash", hashToken(token))
    .gt("expires_at", nowIso)
    .maybeSingle();
  if (error || !data?.profiles) return null;
  // Handle both array and object response from Supabase join
  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  return profile ?? null;
}
