import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchPackages, togglePackage, upsertPackage, deletePackage } from "@/lib/db";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

const packageSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0),
  currency: z.string().optional(),
  status: z.enum(["active", "hidden", "inactive", "upcoming"]),
  features: z.array(z.string()).default([]),
  groups: z.object({ 
    whatsapp: z.string().optional(), 
    telegram: z.string().optional(), 
    facebook: z.string().optional() 
  }).optional().default({}),
});

export async function GET() {
  const result = await fetchPackages(false);
  return NextResponse.json({ packages: result.packages, usingDemo: result.usingDemo });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Package body:", JSON.stringify(body, null, 2));
    const parsed = packageSchema.parse(body);
    const record = await upsertPackage(parsed);
    return NextResponse.json({ ok: true, package: record });
  } catch (error: unknown) {
    console.error("Package save error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to save package";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const schema = z.object({ id: z.string(), status: z.enum(["active", "hidden", "inactive", "upcoming"]) });
    const parsed = schema.parse(body);
    const record = await togglePackage(parsed.id, parsed.status);
    return NextResponse.json({ ok: true, package: record });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const deleteAll = searchParams.get("all") === "true";
    const cascade = searchParams.get("cascade") === "true";

    console.log("DELETE request - id:", id, "deleteAll:", deleteAll, "cascade:", cascade);

    if (deleteAll) {
      const admin = getSupabaseServiceClient();
      // Delete all orders first (no FK constraint)
      const { error: ordersError } = await admin.from("orders").delete().gt("created_at", "1900-01-01");
      if (ordersError) {
        console.error("Delete all orders error:", ordersError);
        // Continue anyway, table might not exist
      }
      const { error } = await admin.from("packages").delete().gt("created_at", "1900-01-01");
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (!id) throw new Error("Missing id");
    
    const admin = getSupabaseServiceClient();
    
    // Always try to delete related orders first (cascade)
    if (cascade) {
      const { error: ordersError } = await admin.from("orders").delete().eq("package_id", id);
      console.log("Delete orders result:", ordersError ? ordersError.message : "success");
      // Continue anyway - orders table might not exist or have no matching rows
    }
    
    // Now delete the package
    console.log("Deleting package with id:", id);
    const { data, error, count } = await admin.from("packages").delete().eq("id", id).select();
    console.log("Delete result - data:", data, "error:", error, "count:", count);
    
    if (error) {
      console.error("Supabase delete error:", error);
      throw new Error(error.message || "Database delete failed");
    }
    
    return NextResponse.json({ ok: true, deleted: data });
  } catch (error: unknown) {
    console.error("Delete package error:", error);
    let message = "Failed to delete";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "object" && error !== null) {
      message = JSON.stringify(error);
    }
    return NextResponse.json({ error: message, details: String(error) }, { status: 400 });
  }
}
