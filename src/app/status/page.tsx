"use client";

import { useState } from "react";
import Link from "next/link";

type StatusState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "pending" }
  | { status: "rejected" }
  | { status: "approved"; accountReady?: boolean };

export default function StatusPage() {
  const [email, setEmail] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [state, setState] = useState<StatusState>({ status: "idle" });

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, transaction_id: transactionId }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Unable to check status");
      }
      if (json.status === "pending") {
        setState({ status: "pending" });
        return;
      }
      if (json.status === "rejected") {
        setState({ status: "rejected" });
        return;
      }
      if (json.status === "approved") {
        setState({
          status: "approved",
          accountReady: Boolean(json.account_ready),
        });
        return;
      }
      setState({ status: "error", message: "Unknown status" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to check status";
      setState({ status: "error", message });
    }
  }

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-xl glass-card p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Check Order Status</h1>
          <p className="text-foreground-muted text-sm mt-2">
            Enter the email and transaction ID you used during purchase.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleCheck}>
          <label className="space-y-1 text-sm block">
            <span>Email</span>
            <input
              className="glass-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="space-y-1 text-sm block">
            <span>Transaction ID</span>
            <input
              className="glass-input"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              required
            />
          </label>
          <div className="flex items-center gap-3">
            <button className="btn-primary" type="submit" disabled={state.status === "loading"}>
              {state.status === "loading" ? "Checking..." : "Check Status"}
            </button>
            <Link href="/purchase" className="text-sm text-foreground-muted">
              Back to Purchase
            </Link>
          </div>
        </form>

        {state.status === "error" && (
          <div className="text-sm text-red-400">{state.message}</div>
        )}
        {state.status === "pending" && (
          <div className="text-sm text-yellow-400">Your order is pending approval.</div>
        )}
        {state.status === "rejected" && (
          <div className="text-sm text-red-400">Your order was rejected. Please contact support.</div>
        )}
        {state.status === "approved" && (
          <div className="space-y-3">
            {!state.accountReady ? (
              <div className="text-sm text-yellow-400">
                Approved — account is being prepared. Please check again soon.
              </div>
            ) : (
              <>
                <div className="text-sm text-green-400">Approved — your access is ready.</div>
                <Link href="/profile" className="btn-primary inline-flex">
                  Open your profile
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
