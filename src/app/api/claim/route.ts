import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServiceClient();
    const now = new Date().toISOString();

    const { data: accessToken, error: tokenError } = await supabase
      .from("access_tokens")
      .select("*")
      .eq("token", token)
      .single();

    if (tokenError || !accessToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    if (accessToken.used_at) {
      return NextResponse.json({ error: "Token already used" }, { status: 410 });
    }

    if (accessToken.expires_at && accessToken.expires_at < now) {
      return NextResponse.json({ error: "Token expired" }, { status: 410 });
    }

    const { data: account, error: accountError } = await supabase
      .from("package_accounts")
      .select("*")
      .eq("id", accessToken.account_id)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    await supabase.from("access_tokens").update({ used_at: now }).eq("id", accessToken.id);

    return NextResponse.json({
      ok: true,
      package_id: accessToken.package_id,
      account: {
        username: account.username,
        password: account.password,
      },
      expires_at: accessToken.expires_at,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to claim access";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
