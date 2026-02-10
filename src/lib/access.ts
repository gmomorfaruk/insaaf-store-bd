import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function assignAccountToOrder(order: { id: string; package_id: string; status: string; account_id?: string | null }) {
  if (order.status !== "approved") {
    console.log("[assignAccountToOrder] Order not approved, skipping. Status:", order.status);
    return { ok: false, status: order.status };
  }

  const supabase = getSupabaseServiceClient();
  const nowIso = new Date().toISOString();

  // If order already has an account assigned, return it
  if (order.account_id) {
    console.log("[assignAccountToOrder] Order already has account_id:", order.account_id);
    const { data: existingAccount } = await supabase
      .from("package_accounts")
      .select("*")
      .eq("id", order.account_id)
      .maybeSingle();
    return { ok: true, account: existingAccount };
  }

  console.log("[assignAccountToOrder] Looking for available account for package:", order.package_id);

  // Find the first available account for this package
  const { data: availableAccount, error: searchError } = await supabase
    .from("package_accounts")
    .select("*")
    .eq("package_id", order.package_id)
    .eq("status", "available")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (searchError) {
    console.error("[assignAccountToOrder] Error searching for available account:", searchError);
  }

  let accountToAssign = availableAccount;
  console.log("[assignAccountToOrder] Available account found:", availableAccount?.id ?? "none");

  if (!accountToAssign) {
    // Fallback: use an assigned account that isn't linked to any order yet
    const { data: unlinkedAssigned } = await supabase
      .from("package_accounts")
      .select("*")
      .eq("package_id", order.package_id)
      .eq("status", "assigned")
      .is("assigned_order_id", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    accountToAssign = unlinkedAssigned ?? null;
    console.log("[assignAccountToOrder] Unlinked assigned account found:", unlinkedAssigned?.id ?? "none");
  }

  if (!accountToAssign) {
    console.log("[assignAccountToOrder] No account available for assignment");
    return { ok: true, pending_account: true };
  }

  console.log("[assignAccountToOrder] Assigning account", accountToAssign.id, "to order", order.id);

  // Update the account to mark it as assigned
  const { data: updatedAccount, error: updateError } = await supabase
    .from("package_accounts")
    .update({
      status: "assigned",
      assigned_order_id: order.id,
      assigned_at: nowIso,
    })
    .eq("id", accountToAssign.id)
    .select()
    .single();

  if (updateError || !updatedAccount) {
    console.error("[assignAccountToOrder] Failed to update account:", updateError);
    return { ok: false, error: "Failed to reserve account, please try again" };
  }

  // Update the order with the account_id
  const { error: orderUpdateError } = await supabase
    .from("orders")
    .update({ account_id: updatedAccount.id })
    .eq("id", order.id);

  if (orderUpdateError) {
    console.error("[assignAccountToOrder] Failed to update order with account_id:", orderUpdateError);
    // Rollback the account status
    await supabase
      .from("package_accounts")
      .update({ status: "available", assigned_order_id: null, assigned_at: null })
      .eq("id", updatedAccount.id);
    return { ok: false, error: "Failed to attach account to order" };
  }

  console.log("[assignAccountToOrder] Successfully assigned account", updatedAccount.id, "to order", order.id);
  return { ok: true, account: updatedAccount };
}
