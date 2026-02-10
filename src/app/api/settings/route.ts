import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

// In-memory fallback for settings (when DB table doesn't exist)
let memorySettings = {
  id: "main",
  whatsapp_link: "",
  telegram_link: "",
  facebook_link: "",
  support_email: "",
  payment_number: "",
};

// Get site settings (links)
export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", "main")
      .maybeSingle(); // Use maybeSingle to handle 0 or 1 row
    
    if (error) {
      console.warn("site_settings table error:", error.message);
      return NextResponse.json({ settings: memorySettings, usingMemory: true });
    }
    
    // If no row exists yet, return defaults but table is set up (not usingMemory)
    if (!data) {
      return NextResponse.json({ settings: memorySettings });
    }
    
    return NextResponse.json({ settings: data });
  } catch (error: unknown) {
    console.warn("Settings API error:", error);
    return NextResponse.json({ settings: memorySettings, usingMemory: true });
  }
}

// Update site settings
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const supabase = getSupabaseServiceClient();
    
    const { data, error } = await supabase
      .from("site_settings")
      .upsert({
        id: "main",
        whatsapp_link: payload.whatsapp_link ?? "",
        telegram_link: payload.telegram_link ?? "",
        facebook_link: payload.facebook_link ?? "",
        support_email: payload.support_email ?? "",
        payment_number: payload.payment_number ?? "",
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      // Table doesn't exist - save in memory
      console.warn("site_settings upsert error:", error.message);
      memorySettings = {
        id: "main",
        whatsapp_link: payload.whatsapp_link ?? "",
        telegram_link: payload.telegram_link ?? "",
        facebook_link: payload.facebook_link ?? "",
        support_email: payload.support_email ?? "",
        payment_number: payload.payment_number ?? "",
      };
      return NextResponse.json({ 
        ok: true, 
        settings: memorySettings,
        warning: "Stored in memory (DB table not set up). Will be lost on server restart."
      });
    }
    return NextResponse.json({ ok: true, settings: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save settings";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
