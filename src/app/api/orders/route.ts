import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrder, fetchOrders, updateOrderStatus } from "@/lib/db";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { assignAccountToOrder } from "@/lib/access";

const orderSchema = z.object({
  full_name: z.string().min(2),
  user_name: z.string().optional(),
  user_id: z.string().optional(),
  email: z.string().email(),
  mobile: z.string().min(6),
  package_id: z.string(),
  source: z.enum(["WhatsApp", "Facebook", "Telegram", "Website"]),
  transaction_id: z.string().min(3),
  price: z.number().min(0),
});

export async function GET() {
  try {
    const orders = await fetchOrders();
    return NextResponse.json({ orders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = orderSchema.parse(payload);
    const record = await createOrder({
      ...parsed,
      user_name: parsed.user_name ?? parsed.full_name,
      status: "pending",
    });
    return NextResponse.json({ ok: true, order: record });
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed to submit order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

const statusSchema = z.object({ id: z.string(), status: z.enum(["pending", "approved", "rejected"]), notes: z.string().optional() });

export async function PATCH(req: Request) {
  try {
    const payload = await req.json();
    const parsed = statusSchema.parse(payload);
    let record = await updateOrderStatus(parsed.id, parsed.status, parsed.notes);
    
    // Auto-assign an available account when order is approved
    if (parsed.status === "approved" && record) {
      const assignResult = await assignAccountToOrder({
        id: record.id,
        package_id: record.package_id,
        status: record.status,
        account_id: record.account_id ?? null,
      });
      
      // Update the record with the assigned account_id so response reflects the change
      if (assignResult.ok && assignResult.account) {
        record = { ...record, account_id: assignResult.account.id };
      }
      
      // Return account info with the response
      return NextResponse.json({ 
        ok: true, 
        order: record, 
        account_assigned: assignResult.ok && assignResult.account ? true : false,
        pending_account: assignResult.pending_account ?? false
      });
    }
    
    return NextResponse.json({ ok: true, order: record });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to update status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const admin = getSupabaseServiceClient();

    // Unlink dependent records to avoid FK violations
    // If FK columns are NOT NULL, unlinking will fail. Delete dependent rows instead.
    const { error: pkgDelErr } = await admin
      .from("package_accounts")
      .delete()
      .not("assigned_order_id", "is", null);
    if (pkgDelErr) {
      return NextResponse.json({ error: `package_accounts cleanup failed: ${pkgDelErr.message}` }, { status: 400 });
    }

    const { error: tokenDelErr } = await admin
      .from("access_tokens")
      .delete()
      .not("order_id", "is", null);
    if (tokenDelErr) {
      return NextResponse.json({ error: `access_tokens cleanup failed: ${tokenDelErr.message}` }, { status: 400 });
    }

    const { error, count } = await admin.from("orders").delete({ count: "exact" }).not("id", "is", null);
    if (error) {
      return NextResponse.json({ error: `orders delete failed: ${error.message}` }, { status: 400 });
    }

    return NextResponse.json({ ok: true, deleted: count });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete all orders";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
