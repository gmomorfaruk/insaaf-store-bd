"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log("supabase signIn", { data, error });
      if (error) {
        setError(error.message);
        return;
      }
      if (!data.session) {
        setError("Signed in but no session was set. Check cookies/local storage and devtools network tab.");
        return;
      }
      router.refresh();
      router.push("/admin");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Supabase not configured";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-base px-6 py-12">
      <div className="glass-card card-hover w-full max-w-md p-8 space-y-6">
        <div className="space-y-2">
          <p className="tagline">Admin only</p>
          <h1 className="text-2xl font-semibold">Sign in to Insaaf Store BD Dashboard</h1>
          <p className="text-sm text-foreground-muted">Protected by Supabase Auth.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="space-y-2 text-sm">
            <span>Email</span>
            <input className="glass-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="space-y-2 text-sm">
            <span>Password</span>
            <input className="glass-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
