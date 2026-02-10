import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

const statusSchema = z.object({
  email: z.string().email(),
  transaction_id: z.string().min(3),
});

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = statusSchema.parse(payload);
    const email = parsed.email.trim();
    const transactionId = parsed.transaction_id.trim();
    const supabase = getSupabaseServiceClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .ilike("email", email)
      .eq("transaction_id", transactionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "approved") {
      return NextResponse.json({ ok: true, status: order.status });
    }
    return NextResponse.json({
      ok: true,
      status: "approved",
      account_ready: Boolean(order.account_id),
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unable to check status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
