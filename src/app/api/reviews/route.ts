import { NextResponse } from "next/server";
import { z } from "zod";
import { createReview, fetchReviews, updateReviewStatus } from "@/lib/db";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

const reviewSchema = z.object({
  name: z.string().min(2),
  rating: z.number().min(1).max(5),
  comment: z.string().min(5),
  source: z.string().optional(),
  institution: z.string().optional(),
  occupation: z.enum(["student", "professional"]).optional(),
});

const statusSchema = z.object({ id: z.string(), status: z.enum(["pending", "approved", "rejected"]) });

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const showAll = searchParams.get("all") === "true";
  // If all=true (admin), require auth and use service role to fetch all
  if (showAll) {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const admin = getSupabaseServiceClient();
    const { data, error } = await admin.from("reviews").select("*").order("created_at", { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ reviews: data ?? [] });
  }
  // Public: only approved reviews
  const reviews = await fetchReviews(true);
  return NextResponse.json({ reviews });
}

export async function POST(req: Request) {
  try {
    const parsed = reviewSchema.parse(await req.json());
    const record = await createReview({
      id: randomUUID(),
      ...parsed,
      status: "pending",
    });
    return NextResponse.json({ ok: true, review: record });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit review";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const parsed = statusSchema.parse(await req.json());
    const record = await updateReviewStatus(parsed.id, parsed.status);
    return NextResponse.json({ ok: true, review: record });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update review";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
