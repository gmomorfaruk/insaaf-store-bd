import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  mobile: z.string().min(6),
  message: z.string().min(5),
});

// In-memory fallback storage (for when DB table doesn't exist)
// Note: This is cleared on server restart - only for demo purposes
const memorySubmissions: Array<{
  id: string;
  name: string;
  email: string;
  mobile: string;
  message: string;
  status: string;
  created_at: string;
}> = [];

// Get all contact submissions (for admin)
export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      // Check if it's a "table doesn't exist" error
      const isTableMissing = error.message?.includes("does not exist") || error.code === "42P01";
      if (isTableMissing) {
        console.warn("contact_submissions table missing:", error.message);
        return NextResponse.json({ submissions: memorySubmissions, usingMemory: true });
      }
      // Other errors - log but don't trigger usingMemory
      console.warn("contact_submissions query error:", error.message);
      return NextResponse.json({ submissions: data ?? [] });
    }
    return NextResponse.json({ submissions: data ?? [] });
  } catch (error: unknown) {
    console.warn("Contact API error:", error);
    return NextResponse.json({ submissions: memorySubmissions, usingMemory: true });
  }
}

// Create new contact submission (from contact form)
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = contactSchema.parse(payload);
    
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("contact_submissions")
      .insert({
        name: parsed.name,
        email: parsed.email,
        mobile: parsed.mobile,
        message: parsed.message,
        status: "new",
      })
      .select()
      .single();
    
    if (error) {
      // If table doesn't exist, store in memory fallback
      console.warn("contact_submissions insert error:", error.message);
      const memoryEntry = {
        id: randomUUID(),
        name: parsed.name,
        email: parsed.email,
        mobile: parsed.mobile,
        message: parsed.message,
        status: "new",
        created_at: new Date().toISOString(),
      };
      memorySubmissions.unshift(memoryEntry); // Add to beginning
      return NextResponse.json({ 
        ok: true, 
        submission: memoryEntry,
        warning: "Stored in memory (DB table not set up). Will be lost on server restart."
      });
    }
    return NextResponse.json({ ok: true, submission: data });
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to submit";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// Mark submission as read/resolved
export async function PATCH(req: Request) {
  try {
    const { id, status } = await req.json();
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("contact_submissions")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      // Try memory fallback
      const idx = memorySubmissions.findIndex(s => s.id === id);
      if (idx !== -1) {
        memorySubmissions[idx].status = status;
        return NextResponse.json({ ok: true, submission: memorySubmissions[idx] });
      }
      throw error;
    }
    return NextResponse.json({ ok: true, submission: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
