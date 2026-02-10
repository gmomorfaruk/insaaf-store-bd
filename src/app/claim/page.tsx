"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type ClaimState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; username: string; password: string; packageId: string; expiresAt?: string };

function ClaimContent() {
  const params = useSearchParams();
  const token = useMemo(() => params.get("token"), [params]);
  const [state, setState] = useState<ClaimState>({ status: "idle" });

  useEffect(() => {
    if (!token) {
      setState({ status: "error", message: "Missing access token." });
      return;
    }
    let active = true;
    async function load() {
      setState({ status: "loading" });
      try {
        const res = await fetch(`/api/claim?token=${encodeURIComponent(token!)}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Unable to claim access");
        }
        if (!active) return;
        setState({
          status: "success",
          username: json.account?.username ?? "",
          password: json.account?.password ?? "",
          packageId: json.package_id ?? "",
          expiresAt: json.expires_at,
        });
      } catch (error: unknown) {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Unable to claim access";
        setState({ status: "error", message });
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-xl glass-card p-8 space-y-4">
        <h1 className="text-2xl font-semibold">Your Package Access</h1>
        {state.status === "loading" && <p className="text-foreground-muted">Loading your access...</p>}
        {state.status === "error" && (
          <p className="text-red-400">{state.message}</p>
        )}
        {state.status === "success" && (
          <div className="space-y-4">
            <p className="text-foreground-muted">Below are your credentials. Please save them securely.</p>
            <div className="glass-card p-4 space-y-2 border border-[color:var(--border)]">
              <div className="text-xs text-foreground-muted">Package</div>
              <div className="text-lg font-semibold">{state.packageId}</div>
              <div className="text-xs text-foreground-muted mt-3">Email / Username</div>
              <div className="font-mono text-sm break-all">{state.username}</div>
              <div className="text-xs text-foreground-muted mt-3">Password</div>
              <div className="font-mono text-sm break-all">{state.password}</div>
            </div>
            <p className="text-xs text-foreground-muted">
              This link is valid for a limited time. Do not share it with anyone.
              {state.expiresAt ? ` Expires at ${new Date(state.expiresAt).toLocaleString()}.` : ""}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen px-6 py-16">
        <div className="mx-auto max-w-xl glass-card p-8 space-y-4">
          <h1 className="text-2xl font-semibold">Your Package Access</h1>
          <p className="text-foreground-muted">Loading...</p>
        </div>
      </main>
    }>
      <ClaimContent />
    </Suspense>
  );
}
