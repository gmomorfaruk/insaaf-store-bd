import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getProfileFromRequest } from "@/lib/profile-auth";

const updateSchema = z.object({
  full_name: z.string().min(2).optional(),
  mobile: z.string().min(6).optional(),
});

function formatProfileNumber(n: number) {
  return String(n).padStart(4, "0");
}

export async function GET(req: Request) {
  const profile = await getProfileFromRequest(req);
  if (!profile) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    profile: {
      ...profile,
      profile_id: formatProfileNumber(profile.profile_number),
    },
  });
}

export async function PATCH(req: Request) {
  try {
    const profile = await getProfileFromRequest(req);
    if (!profile) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const payload = updateSchema.parse(await req.json());
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", profile.id)
      .select("id, profile_number, full_name, email, mobile, created_at")
      .single();
    if (error || !data) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      profile: {
        ...data,
        profile_id: formatProfileNumber(data.profile_number),
      },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
