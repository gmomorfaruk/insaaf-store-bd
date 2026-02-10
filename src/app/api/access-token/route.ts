import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { assignAccountToOrder } from "@/lib/access";
import { requireAdminUser } from "@/lib/admin-auth";

const payloadSchema = z.object({
  order_id: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = payloadSchema.parse(payload);
    // Admin-only: generating access tokens should be restricted.
    const admin = await requireAdminUser();
    if (!admin.ok) return admin.response;
    const supabase = getSupabaseServiceClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", parsed.order_id)
      .single();
    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.status !== "approved") {
      return NextResponse.json({ error: "Order must be approved first" }, { status: 400 });
    }

    const access = await assignAccountToOrder(order);
    if (!access.ok) {
      return NextResponse.json({ error: access.error || "Unable to assign account" }, { status: 400 });
    }
    if (access.pending_account) {
      return NextResponse.json({ error: "No available accounts for this package" }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      account_id: access.account?.id,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unable to assign account";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
