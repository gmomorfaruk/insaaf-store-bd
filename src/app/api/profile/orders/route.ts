import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getProfileFromRequest } from "@/lib/profile-auth";
import { assignAccountToOrder } from "@/lib/access";

type OrderWithAccount = {
  id: string;
  package_id: string;
  transaction_id: string;
  price: number;
  currency?: string;
  status: "pending" | "approved" | "rejected";
  created_at?: string;
  account_id?: string | null;
  profile_id?: string | null;
  email: string;
  account?: { username: string; password: string } | null;
};

export async function GET(req: Request) {
  const profile = await getProfileFromRequest(req);
  if (!profile) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  console.log("[profile/orders] Fetching orders for profile:", profile.id, "email:", profile.email);

  const supabase = getSupabaseServiceClient();
  const baseSelect =
    "id, package_id, transaction_id, price, currency, status, created_at, account_id, profile_id, email, account:package_accounts!orders_account_id_fkey(username, password)";

  // Try to find orders by profile_id first
  const { data: byProfile, error: byProfileError } = await supabase
    .from("orders")
    .select(baseSelect)
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false });

  if (byProfileError) {
    console.error("[profile/orders] Error fetching by profile_id:", byProfileError);
    return NextResponse.json({ error: byProfileError.message ?? "Failed to fetch orders" }, { status: 400 });
  }

  // Normalize the account field (Supabase join can return array or object)
  function normalizeAccount(acc: unknown): { username: string; password: string } | null {
    if (!acc) return null;
    if (Array.isArray(acc)) return acc[0] ?? null;
    return acc as { username: string; password: string };
  }

  let orders: OrderWithAccount[] = (byProfile ?? []).map((o) => ({
    ...o,
    account: normalizeAccount(o.account),
  }));
  
  console.log("[profile/orders] Found", orders.length, "orders by profile_id");
  
  // If no orders found by profile_id, try by email
  if (!orders.length) {
    const { data: byEmail, error: byEmailError } = await supabase
      .from("orders")
      .select(baseSelect)
      .eq("email", profile.email)
      .order("created_at", { ascending: false });
    if (byEmailError) {
      console.error("[profile/orders] Error fetching by email:", byEmailError);
      return NextResponse.json({ error: byEmailError.message ?? "Failed to fetch orders" }, { status: 400 });
    }
    orders = (byEmail ?? []).map((o) => ({
      ...o,
      account: normalizeAccount(o.account),
    }));
    console.log("[profile/orders] Found", orders.length, "orders by email");
  }

  // Process each order to ensure account is assigned
  for (const order of orders) {
    console.log("[profile/orders] Processing order:", order.id, "status:", order.status, "account_id:", order.account_id, "has account:", !!order.account);
    
    // If order is approved but has no account, try to assign one
    if (order.status === "approved" && !order.account_id && !order.account) {
      console.log("[profile/orders] Attempting to assign account for approved order:", order.id);
      const assignResult = await assignAccountToOrder({
        id: order.id,
        package_id: order.package_id,
        status: order.status,
        account_id: order.account_id ?? null,
      });
      
      if (assignResult.ok && assignResult.account) {
        console.log("[profile/orders] Account assigned:", assignResult.account.id);
        order.account_id = assignResult.account.id;
        order.account = { 
          username: assignResult.account.username, 
          password: assignResult.account.password 
        };
        continue;
      }
    }
    
    // If order has account_id but account wasn't joined (FK issue), fetch it directly
    if (order.account_id && !order.account) {
      console.log("[profile/orders] Fetching account directly for account_id:", order.account_id);
      const { data: accountData } = await supabase
        .from("package_accounts")
        .select("username, password")
        .eq("id", order.account_id)
        .maybeSingle();
      if (accountData) {
        order.account = accountData;
        console.log("[profile/orders] Found account by direct fetch");
      }
    }
    
    // Fallback: look for account by assigned_order_id
    if (!order.account && order.status === "approved") {
      console.log("[profile/orders] Looking for account by assigned_order_id:", order.id);
      const { data: assigned } = await supabase
        .from("package_accounts")
        .select("username, password")
        .eq("assigned_order_id", order.id)
        .limit(1)
        .maybeSingle();
      if (assigned) {
        order.account = assigned;
        console.log("[profile/orders] Found account by assigned_order_id");
      }
    }
  }

  return NextResponse.json({ ok: true, orders });
}
