import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-auth";

export async function GET() {
  // Admin-only: profile list includes PII.
  const admin = await requireAdminUser();
  if (!admin.ok) return admin.response;

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, profile_number, full_name, email, mobile, created_at")
    .order("profile_number", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, profiles: data ?? [] });
}
