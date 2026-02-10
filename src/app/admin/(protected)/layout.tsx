import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/admin/login");
    }
  } catch {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
