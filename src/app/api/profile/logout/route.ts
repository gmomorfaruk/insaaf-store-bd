import { NextResponse } from "next/server";
import { clearProfileSession } from "@/lib/profile-auth";

export async function POST(req: Request) {
  const cookieHeader = req.headers.get("cookie");
  const token = cookieHeader
    ?.split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith("profile_session="))
    ?.split("=")[1];
  if (token) {
    await clearProfileSession(decodeURIComponent(token));
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("profile_session");
  return res;
}
