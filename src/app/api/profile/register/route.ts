import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { createProfileSession, hashPassword } from "@/lib/profile-auth";

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  mobile: z.string().min(6),
});

function formatProfileNumber(n: number) {
  return String(n).padStart(4, "0");
}

export async function POST(req: Request) {
  try {
    const payload = schema.parse(await req.json());
    const supabase = getSupabaseServiceClient();

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", payload.email)
      .maybeSingle();
    if (existing?.id) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .insert({
        full_name: payload.full_name,
        email: payload.email,
        password_hash: hashPassword(payload.password),
        mobile: payload.mobile,
      })
      .select("id, profile_number, full_name, email, mobile, created_at")
      .single();
    if (error || !profile) {
      return NextResponse.json({ error: "Failed to create profile" }, { status: 400 });
    }

    const session = await createProfileSession(profile.id);
    const res = NextResponse.json({
      ok: true,
      profile: {
        ...profile,
        profile_id: formatProfileNumber(profile.profile_number),
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
    const message = error instanceof Error ? error.message : "Failed to register";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
