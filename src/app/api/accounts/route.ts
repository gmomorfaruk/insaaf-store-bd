import { NextResponse } from "next/server";
import { z } from "zod";
import { createPackageAccount, deletePackageAccount, fetchPackageAccounts } from "@/lib/db";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-auth";

const accountSchema = z.object({
  package_id: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  status: z.enum(["available", "assigned", "revoked"]).optional(),
});

export async function GET() {
  try {
    // Admin-only: package account credentials are sensitive.
    const admin = await requireAdminUser();
    if (!admin.ok) return admin.response;
    const accounts = await fetchPackageAccounts();
    return NextResponse.json({ accounts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch accounts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Admin-only: account creation is privileged.
    const admin = await requireAdminUser();
    if (!admin.ok) return admin.response;
    const payload = await req.json();
    const parsed = accountSchema.parse(payload);
    let record = await createPackageAccount(parsed);
    let autoAssigned = false;
    let assignedOrderId: string | null = null;
    
    // Auto-assign to the oldest approved order without an account
    try {
      const supabase = getSupabaseServiceClient();
      const { data: order } = await supabase
        .from("orders")
        .select("id, status, account_id")
        .eq("package_id", record.package_id)
        .eq("status", "approved")
        .is("account_id", null)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (order?.id && !order.account_id) {
        const nowIso = new Date().toISOString();
        const { data: updatedAccount, error: accErr } = await supabase
          .from("package_accounts")
          .update({
            status: "assigned",
            assigned_order_id: order.id,
            assigned_at: nowIso,
          })
          .eq("id", record.id)
          .select()
          .single();

        if (accErr) {
          console.error("Auto-assign account update error:", accErr);
        } else if (updatedAccount) {
          record = updatedAccount;
        }

        const { error: orderErr } = await supabase
          .from("orders")
          .update({ account_id: record.id })
          .eq("id", order.id);
        
        if (orderErr) {
          console.error("Auto-assign order update error:", orderErr);
        } else {
          autoAssigned = true;
          assignedOrderId = order.id;
        }
      }
    } catch (err) {
      console.error("Auto-assign failed:", err);
    }
    return NextResponse.json({ 
      ok: true, 
      account: record, 
      auto_assigned: autoAssigned,
      assigned_order_id: assignedOrderId 
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to create account";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    // Admin-only: deleting accounts must be restricted.
    const admin = await requireAdminUser();
    if (!admin.ok) return admin.response;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) throw new Error("Missing id");
    await deletePackageAccount(id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
