"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatEntry, OrderRecord, PackageRecord } from "@/lib/types";
import { Download, LogOut, Plus, RefreshCw, ShieldCheck, Trash } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

type Props = {
  initialPackages: PackageRecord[];
  initialOrders: OrderRecord[];
  initialChat: ChatEntry[];
};

export default function DashboardShell({ initialPackages, initialOrders, initialChat }: Props) {
  const router = useRouter();
  const [packages, setPackages] = useState<PackageRecord[]>(initialPackages);
  const [orders, setOrders] = useState<OrderRecord[]>(initialOrders);
  const [chatEntries, setChatEntries] = useState<ChatEntry[]>(initialChat);
  const [pkgForm, setPkgForm] = useState<PackageRecord>({
    id: "",
    name: "",
    description: "",
    price: 0,
    currency: "USD",
    status: "active",
    features: [],
    groups: {},
  });

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  }
  const [saving, setSaving] = useState(false);
  const [notif, setNotif] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = orders.length;
    const approved = orders.filter((o) => o.status === "approved");
    const revenue = approved.reduce((sum, o) => sum + (o.price ?? 0), 0);
    return { total, approved: approved.length, revenue };
  }, [orders]);

  const packageBreakdown = useMemo(() => {
    return orders.reduce<Record<string, { count: number; revenue: number }>>((acc, order) => {
      const current = acc[order.package_id] ?? { count: 0, revenue: 0 };
      current.count += 1;
      current.revenue += order.price ?? 0;
      acc[order.package_id] = current;
      return acc;
    }, {});
  }, [orders]);

  async function handlePackageSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setNotif(null);
    try {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...pkgForm,
          price: Number(pkgForm.price),
          features: pkgForm.features,
          groups: pkgForm.groups,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const errMsg = Array.isArray(json.error) 
          ? json.error.map((e: {path?: string[], message?: string}) => `${e.path?.join(".")||"field"}: ${e.message}`).join(", ")
          : json.error || "Failed to save package";
        throw new Error(errMsg);
      }
      setPackages((prev) => {
        const exists = prev.find((p) => p.id === json.package.id);
        if (exists) {
          return prev.map((p) => (p.id === json.package.id ? json.package : p));
        }
        return [...prev, json.package];
      });
      setPkgForm({
        id: "",
        name: "",
        description: "",
        price: 0,
        currency: "USD",
        status: "active",
        features: [],
        groups: {},
      });
      setNotif("Package saved");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error saving package";
      setNotif(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: PackageRecord["status"]) {
    await fetch("/api/packages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  async function handleDelete(id: string) {
    await fetch(`/api/packages?id=${id}`, { method: "DELETE" });
    setPackages((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleOrderStatus(id: string, status: OrderRecord["status"]) {
    await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  async function handleChatSave(entry: ChatEntry) {
    const res = await fetch("/api/chat", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    const json = await res.json();
    if (res.ok) {
      setChatEntries((prev) => {
        const exists = prev.find((c) => c.id === entry.id);
        if (exists) return prev.map((c) => (c.id === entry.id ? json.entry : c));
        return [...prev, json.entry];
      });
    }
  }

  function exportCsv<T extends Record<string, unknown>>(rows: T[], filename: string) {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="tagline">Admin dashboard</p>
            <h1 className="text-2xl font-semibold">Control packages, orders, chatbot, and exports</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-ghost flex items-center gap-2 text-sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={16} /> Refresh
            </button>
            <button
              className="btn-primary flex items-center gap-2 text-sm"
              onClick={handleLogout}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="glass-card p-4 border border-[color:var(--border)]">
            <p className="text-sm text-foreground-muted">Total orders</p>
            <div className="text-3xl font-bold">{stats.total}</div>
          </div>
          <div className="glass-card p-4 border border-[color:var(--border)]">
            <p className="text-sm text-foreground-muted">Approved</p>
            <div className="text-3xl font-bold">{stats.approved}</div>
          </div>
          <div className="glass-card p-4 border border-[color:var(--border)]">
            <p className="text-sm text-foreground-muted">Revenue</p>
            <div className="text-3xl font-bold">{formatCurrency(stats.revenue)}</div>
          </div>
        </div>
      </section>

      <section className="glass-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Package management</h2>
          <button className="btn-primary text-sm flex items-center gap-2" onClick={() => exportCsv(packages, "packages.csv")}> <Download size={16} /> Export</button>
        </div>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handlePackageSave}>
          <label className="space-y-2 text-sm">
            <span>Name</span>
            <input className="glass-input" value={pkgForm.name} onChange={(e) => {
              const name = e.target.value;
              const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
              setPkgForm({ ...pkgForm, name, id: pkgForm.id || slug });
            }} required />
          </label>
          <label className="space-y-2 text-sm">
            <span>ID (slug) - auto-generated</span>
            <input className="glass-input" value={pkgForm.id} onChange={(e) => setPkgForm({ ...pkgForm, id: e.target.value })} required />
          </label>
          <label className="space-y-2 text-sm md:col-span-2">
            <span>Description</span>
            <textarea className="glass-input min-h-20" value={pkgForm.description} onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })} required />
          </label>
          <label className="space-y-2 text-sm">
            <span>Price (USD)</span>
            <input className="glass-input" type="number" value={pkgForm.price} onChange={(e) => setPkgForm({ ...pkgForm, price: Number(e.target.value) })} />
          </label>
          <label className="space-y-2 text-sm">
            <span>Status</span>
            <select className="glass-input" value={pkgForm.status} onChange={(e) => setPkgForm({ ...pkgForm, status: e.target.value as PackageRecord["status"] })}>
              <option value="active">Active</option>
              <option value="hidden">Hidden</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span>Features (comma separated)</span>
            <input
              className="glass-input"
              placeholder="Priority support, Weekly review"
              value={pkgForm.features.join(", ")}
              onChange={(e) => setPkgForm({ ...pkgForm, features: e.target.value.split(",").map((f) => f.trim()).filter(Boolean) })}
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Group links</span>
            <input
              className="glass-input"
              placeholder="WhatsApp URL"
              value={pkgForm.groups.whatsapp ?? ""}
              onChange={(e) => setPkgForm({ ...pkgForm, groups: { ...pkgForm.groups, whatsapp: e.target.value } })}
            />
            <input
              className="glass-input"
              placeholder="Telegram URL"
              value={pkgForm.groups.telegram ?? ""}
              onChange={(e) => setPkgForm({ ...pkgForm, groups: { ...pkgForm.groups, telegram: e.target.value } })}
            />
            <input
              className="glass-input"
              placeholder="Facebook URL"
              value={pkgForm.groups.facebook ?? ""}
              onChange={(e) => setPkgForm({ ...pkgForm, groups: { ...pkgForm.groups, facebook: e.target.value } })}
            />
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
              <Plus size={16} /> {saving ? "Saving..." : pkgForm.id && packages.find(p => p.id === pkgForm.id) ? "Update package" : "Save package"}
            </button>
            {pkgForm.id && packages.find(p => p.id === pkgForm.id) && (
              <button type="button" className="btn-ghost text-sm" onClick={() => setPkgForm({ id: "", name: "", description: "", price: 0, currency: "USD", status: "active", features: [], groups: {} })}>
                Cancel edit
              </button>
            )}
          </div>
          {notif && <p className="text-sm text-foreground-muted">{notif}</p>}
        </form>
        <div className="grid-auto">
          {packages.map((pkg) => (
            <div key={pkg.id} className="glass-card p-4 border border-[color:var(--border)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase text-foreground-muted">{pkg.id}</div>
                  <div className="text-lg font-semibold">{pkg.name}</div>
                  <p className="text-sm text-foreground-muted">{pkg.description}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold">{formatCurrency(pkg.price)}</div>
                  <div className="text-xs text-foreground-muted">{pkg.status}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-3 text-xs">
                {pkg.features?.map((f) => (
                  <span key={f} className="badge">{f}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-3 text-xs text-foreground-muted">
                {pkg.groups?.whatsapp && <a className="pill" href={pkg.groups.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>}
                {pkg.groups?.telegram && <a className="pill" href={pkg.groups.telegram} target="_blank" rel="noreferrer">Telegram</a>}
                {pkg.groups?.facebook && <a className="pill" href={pkg.groups.facebook} target="_blank" rel="noreferrer">Facebook</a>}
              </div>
              <div className="flex gap-2 pt-3">
                <button className="btn-primary text-xs" onClick={() => setPkgForm(pkg)}>Edit</button>
                <button className="btn-ghost text-xs" onClick={() => handleStatusChange(pkg.id, pkg.status === "active" ? "hidden" : "active")}>{pkg.status === "active" ? "Hide" : "Activate"}</button>
                <button className="btn-ghost text-xs text-red-400" onClick={() => handleDelete(pkg.id)}>
                  <Trash size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Orders & approvals</h2>
          <button className="btn-primary text-sm flex items-center gap-2" onClick={() => exportCsv(orders, "orders.csv")}> <Download size={16} /> Export</button>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-foreground-muted">
              <tr>
                <th className="p-2">Customer</th>
                <th className="p-2">Package</th>
                <th className="p-2">Source</th>
                <th className="p-2">Status</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-[color:var(--border)]">
                  <td className="p-2">
                    <div className="font-medium">{order.full_name}</div>
                    <div className="text-xs text-foreground-muted">{order.email}</div>
                  </td>
                  <td className="p-2">{order.package_id}</td>
                  <td className="p-2">{order.source}</td>
                  <td className="p-2 text-xs">
                    <span className="pill">{order.status}</span>
                  </td>
                  <td className="p-2">{formatCurrency(order.price ?? 0)}</td>
                  <td className="p-2 flex gap-2">
                    <button className="btn-primary text-xs" onClick={() => handleOrderStatus(order.id, "approved")}>Approve</button>
                    <button className="btn-ghost text-xs" onClick={() => handleOrderStatus(order.id, "rejected")}>Reject</button>
                  </td>
                </tr>
              ))}
              {!orders.length && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-foreground-muted">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Analytics</h2>
          <div className="text-sm text-foreground-muted">Package-wise counts and revenue</div>
        </div>
        <div className="grid-auto">
          {Object.entries(packageBreakdown).map(([pkgId, row]) => (
            <div key={pkgId} className="glass-card p-4 border border-[color:var(--border)]">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{pkgId}</div>
                <ShieldCheck size={16} className="text-accent" />
              </div>
              <p className="text-sm text-foreground-muted">Sales: {row.count}</p>
              <p className="text-sm text-foreground-muted">Revenue: {formatCurrency(row.revenue)}</p>
            </div>
          ))}
          {!Object.keys(packageBreakdown).length && <p className="text-sm text-foreground-muted">No analytics yet.</p>}
        </div>
      </section>

      <section className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">AI chatbot knowledge</h2>
          <div className="text-sm text-foreground-muted">Edit canned answers and enable/disable bot.</div>
        </div>
        <div className="grid-auto">
          {chatEntries.map((entry) => (
            <div key={entry.id} className="glass-card p-4 border border-[color:var(--border)]">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{entry.topic}</div>
                <label className="text-xs flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={entry.enabled}
                    onChange={(e) => handleChatSave({ ...entry, enabled: e.target.checked })}
                  />
                  Enabled
                </label>
              </div>
              <p className="text-sm text-foreground-muted">{entry.prompt}</p>
              <textarea
                className="glass-input mt-2 min-h-20"
                value={entry.response}
                onChange={(e) => setChatEntries((prev) => prev.map((c) => (c.id === entry.id ? { ...c, response: e.target.value } : c)))}
                onBlur={(e) => handleChatSave({ ...entry, response: e.target.value })}
              />
            </div>
          ))}
          <div className="glass-card p-4 border border-[color:var(--border)] space-y-2">
            <p className="text-sm font-semibold">Add new knowledge</p>
            <input
              className="glass-input"
              placeholder="ID"
              onChange={() => setNotif(null)}
              onBlur={(e) => handleChatSave({ id: e.target.value, topic: "New entry", prompt: "", response: "", enabled: true })}
            />
            <p className="text-xs text-foreground-muted">Blur to save quickly. Edit after creation.</p>
          </div>
        </div>
      </section>

      <section className="glass-card p-6 space-y-3">
        <h2 className="text-xl font-semibold">Export & migration</h2>
        <p className="text-sm text-foreground-muted">Export packages and orders as CSV for migrations. Database layer is abstracted in lib/db.ts for future engines.</p>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary flex items-center gap-2" onClick={() => exportCsv(packages, "packages.csv")}> <Download size={16} /> Export packages</button>
          <button className="btn-ghost flex items-center gap-2" onClick={() => exportCsv(orders, "orders.csv")}> <Download size={16} /> Export orders</button>
        </div>
      </section>
    </div>
  );
}
