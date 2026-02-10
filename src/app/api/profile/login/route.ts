import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { createProfileSession, verifyPassword } from "@/lib/profile-auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function formatProfileNumber(n: number) {
  return String(n).padStart(4, "0");
}

export async function POST(req: Request) {
  try {
    const payload = schema.parse(await req.json());
    const supabase = getSupabaseServiceClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, profile_number, full_name, email, mobile, password_hash, created_at")
      .ilike("email", payload.email)
      .maybeSingle();

    if (!profile || !verifyPassword(payload.password, profile.password_hash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const session = await createProfileSession(profile.id);
    const res = NextResponse.json({
      ok: true,
      profile: {
        id: profile.id,
        profile_number: profile.profile_number,
        profile_id: formatProfileNumber(profile.profile_number),
        full_name: profile.full_name,
        email: profile.email,
        mobile: profile.mobile,
        created_at: profile.created_at,
      },
    });
    res.cookies.set("profile_session", session.token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // Only send cookies over HTTPS in production.
      secure: process.env.NODE_ENV === "production",
      expires: new Date(session.expiresAt),
    });
    return res;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to login";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
