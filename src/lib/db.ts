import { demoPackages } from "@/data/packages";
import { demoReviews } from "@/data/reviews";
import { ChatEntry, OrderRecord, OrderStatus, PackageAccountRecord, PackageRecord, PackageStatus, ReviewRecord, ReviewStatus } from "./types";
import { getSupabaseServerClient, getSupabaseServiceClient } from "./supabase/server";

const PACKAGES_TABLE = "packages";
const ORDERS_TABLE = "orders";
const CHAT_TABLE = "chat_entries";
const REVIEWS_TABLE = "reviews";
const ACCOUNTS_TABLE = "package_accounts";

export async function fetchPackages(activeOnly = true): Promise<{ packages: PackageRecord[], usingDemo: boolean }> {
  try {
    const supabase = await getSupabaseServerClient();
    const query = supabase.from(PACKAGES_TABLE).select("*").order("created_at", { ascending: true });
    if (activeOnly) {
      query.eq("status", "active");
    }
    const { data, error } = await query;
    if (error) {
      // Check if it's a "table doesn't exist" error
      const isTableMissing = error.message?.includes("does not exist") || error.code === "42P01";
      if (isTableMissing) {
        console.warn("packages table missing, using demo:", error.message);
        return { packages: demoPackages, usingDemo: true };
      }
      // Other errors - return empty but don't show demo warning
      console.warn("packages query error:", error.message);
      return { packages: [], usingDemo: false };
    }
    return { packages: data ?? [], usingDemo: false };
  } catch (error) {
    console.warn("Supabase unavailable, using demo packages", error);
    return { packages: demoPackages, usingDemo: true };
  }
}

export async function fetchPackagesAdmin(): Promise<PackageRecord[]> {
  try {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase.from(PACKAGES_TABLE).select("*").order("created_at", { ascending: true });
    if (error) {
      console.error("fetchPackagesAdmin error:", error);
      throw error;
    }
    return data ?? [];
  } catch (error) {
    console.error("fetchPackagesAdmin failed:", error);
    // Return empty array instead of throwing - let admin see empty state
    return [];
  }
}

export async function upsertPackage(pkg: PackageRecord) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from(PACKAGES_TABLE).upsert(pkg).select().single();
  if (error) throw error;
  return data;
}

export async function togglePackage(id: string, status: PackageStatus) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from(PACKAGES_TABLE)
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePackage(id: string) {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from(PACKAGES_TABLE).delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function createOrder(order: Omit<OrderRecord, "id" | "created_at">) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from(ORDERS_TABLE).insert(order).select().single();
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(id: string, status: OrderStatus, notes?: string) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .update({ status, notes })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchOrders(filter?: { package_id?: string; from?: string; to?: string }) {
  const supabase = await getSupabaseServerClient();
  let query = supabase.from(ORDERS_TABLE).select("*").order("created_at", { ascending: false });

  if (filter?.package_id) {
    query = query.eq("package_id", filter.package_id);
  }
  if (filter?.from) {
    query = query.gte("created_at", filter.from);
  }
  if (filter?.to) {
    query = query.lte("created_at", filter.to);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchOrdersAdmin() {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from(ORDERS_TABLE).select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchChatEntries(): Promise<ChatEntry[]> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from(CHAT_TABLE)
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.warn("Chat entries fallback", error);
    return [
      {
        id: "policies",
        topic: "Policies",
        prompt: "What are Insaaf Store BD policies?",
        response: "We follow clear Terms, Privacy, Refund, and Disclaimer. See /policy or ask to open policies.",
        enabled: true,
        tags: ["policy", "terms"],
      },
      {
        id: "payment",
        topic: "Payment",
        prompt: "How to pay?",
        response: "Send payment to the admin-defined number, keep your transaction ID, submit via the purchase form, and share a screenshot in the group.",
        enabled: true,
        tags: ["payment", "buy"],
      },
    ];
  }
}

export async function upsertChatEntry(entry: ChatEntry) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from(CHAT_TABLE).upsert(entry).select().single();
  if (error) throw error;
  return data;
}

export async function fetchReviews(approvedOnly = true): Promise<ReviewRecord[]> {
  try {
    const supabase = await getSupabaseServerClient();
    const query = supabase.from(REVIEWS_TABLE).select("*").order("created_at", { ascending: false });
    if (approvedOnly) {
      query.eq("status", "approved");
    }
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.warn("Review fallback", error);
    return demoReviews;
  }
}

export async function createReview(review: ReviewRecord) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from(REVIEWS_TABLE).insert(review).select().single();
  if (error) throw error;
  return data;
}

export async function updateReviewStatus(id: string, status: ReviewStatus) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from(REVIEWS_TABLE)
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchPackageAccounts(): Promise<PackageAccountRecord[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from(ACCOUNTS_TABLE)
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createPackageAccount(
  account: Omit<PackageAccountRecord, "id" | "created_at" | "assigned_order_id" | "assigned_at" | "status"> & {
    status?: PackageAccountRecord["status"];
  }
) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from(ACCOUNTS_TABLE)
    .insert({
      ...account,
      status: account.status ?? "available",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePackageAccount(id: string) {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from(ACCOUNTS_TABLE).delete().eq("id", id);
  if (error) throw error;
  return true;
}
