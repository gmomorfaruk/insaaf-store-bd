"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PackageAccountRecord, PackageRecord, OrderRecord, ReviewRecord, ProfileRecord } from "@/lib/types";
import { Download, LogOut, Plus, RefreshCw, Trash, CheckCircle, XCircle, Mail, Settings, Package, ShoppingCart, Star } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function formatCurrency(value: number) {
  return "৳" + new Intl.NumberFormat("en-BD").format(value);
}

type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  message: string;
  status: "new" | "read" | "resolved";
  created_at?: string;
};

type SiteSettings = {
  whatsapp_link: string;
  telegram_link: string;
  facebook_link: string;
  support_email: string;
  payment_number: string;
};

type Props = {
  initialPackages: PackageRecord[];
  initialOrders: OrderRecord[];
};

export default function SimpleDashboard({ initialPackages, initialOrders }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "packages" | "orders" | "profiles" | "accounts" | "reviews" | "contacts" | "settings">("overview");
  
  // Data states
  const [packages, setPackages] = useState<PackageRecord[]>(initialPackages);
  const [orders, setOrders] = useState<OrderRecord[]>(initialOrders);
  const [accounts, setAccounts] = useState<PackageAccountRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({
    whatsapp_link: "",
    telegram_link: "",
    facebook_link: "",
    support_email: "",
    payment_number: "",
  });
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [accountForm, setAccountForm] = useState({
    package_id: "",
    username: "",
    password: "",
  });
  
  // Form states
  const [pkgForm, setPkgForm] = useState<PackageRecord>({
    id: "",
    name: "",
    description: "",
    price: 0,
    currency: "BDT",
    status: "active",
    features: [],
    groups: {},
  });
  const [saving, setSaving] = useState(false);
  const [notif, setNotif] = useState<string | null>(null);
  const [usingMemory, setUsingMemory] = useState(false);
  const [bulkWorking, setBulkWorking] = useState(false);
  const [featuresText, setFeaturesText] = useState("");

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [contactsRes, settingsRes, reviewsRes, packagesRes] = await Promise.all([
          fetch("/api/contact"),
          fetch("/api/settings"),
          fetch("/api/reviews?all=true"),
          fetch("/api/packages"),
        ]);
        if (contactsRes.ok) {
          const json = await contactsRes.json();
          setContacts(json.submissions ?? []);
          if (json.usingMemory) setUsingMemory(true);
        }
        if (settingsRes.ok) {
          const json = await settingsRes.json();
          if (json.settings) {
            setSettings(json.settings);
          }
          if (json.usingMemory) setUsingMemory(true);
        }
        if (reviewsRes.ok) {
          const json = await reviewsRes.json();
          setReviews(json.reviews ?? []);
        }
        if (packagesRes.ok) {
          const json = await packagesRes.json();
          // Update packages if we got fresh data
          if (json.packages) {
            setPackages(json.packages);
          }
          // Check if using demo mode
          if (json.usingDemo) setUsingMemory(true);
        }
        // Fetch accounts
        const accountsRes = await fetch("/api/accounts", { credentials: "include" });
        if (accountsRes.ok) {
          const json = await accountsRes.json();
          setAccounts(json.accounts ?? []);
        } else {
          const json = await accountsRes.json().catch(() => ({}));
          if (json?.error) setNotif("✗ " + json.error);
        }
        // Fetch profiles
        const profilesRes = await fetch("/api/profiles", { credentials: "include" });
        if (profilesRes.ok) {
          const json = await profilesRes.json();
          setProfiles(json.profiles ?? []);
        }
      } catch {
        // Silently fail
      }
    }
    fetchData();
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const confirmedOrders = orders.filter((o) => o.status === "approved");
    const totalSales = confirmedOrders.reduce((sum, o) => sum + (o.price ?? 0), 0);
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const newContacts = contacts.filter((c) => c.status === "new").length;
    const pendingReviews = reviews.filter((r) => r.status === "pending").length;
    return { totalOrders, confirmedOrders: confirmedOrders.length, totalSales, pendingOrders, newContacts, pendingReviews };
  }, [orders, contacts, reviews]);

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  async function handlePackageSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setNotif(null);
    
    // Parse features from text input
    const parsedFeatures = featuresText
      .split(/[,\n]+/)
      .map((f) => f.trim())
      .filter(Boolean);
    
    try {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...pkgForm,
          price: Number(pkgForm.price),
          features: parsedFeatures,
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
      setPkgForm({ id: "", name: "", description: "", price: 0, currency: "BDT", status: "active", features: [], groups: {} });
      setFeaturesText("");
      setNotif("✓ Package saved!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error saving package";
      setNotif("✗ " + message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this package and any related orders?")) return;
    setNotif(null);
    console.log("Deleting package:", id);
    try {
      const res = await fetch(`/api/packages?id=${encodeURIComponent(id)}&cascade=true`, { method: "DELETE" });
      console.log("Delete response status:", res.status);
      const json = await res.json().catch(() => ({}));
      console.log("Delete response:", json);
      if (!res.ok) {
        setNotif("✗ " + (json.error || "Failed to delete package"));
        return;
      }
      setPackages((prev) => prev.filter((p) => p.id !== id));
      setNotif("✓ Package deleted");
    } catch (err) {
      console.error("Delete error:", err);
      setNotif("✗ Network error deleting package");
    }
  }

  async function handleOrderStatus(id: string, status: OrderRecord["status"]) {
    const res = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNotif("✗ " + (json.error || "Failed to update order"));
      return;
    }
    // Use the updated order from server response to capture account_id changes
    const updatedOrder = json.order;
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updatedOrder } : o)));
    // If an account was assigned, refresh accounts list to show the assignment
    if (json.account_assigned) {
      fetch("/api/accounts", { credentials: "include" })
        .then((r) => r.json())
        .then((data) => setAccounts(data.accounts ?? []))
        .catch(() => {});
      setNotif("✓ Order approved & account assigned");
    } else if (json.pending_account) {
      setNotif("✓ Order approved - waiting for account");
    }
  }

  async function handleReviewStatus(id: string, status: ReviewRecord["status"]) {
    const res = await fetch("/api/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNotif("✗ " + (json.error || "Failed to update review"));
      return;
    }
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setNotif("✓ Review updated");
  }

  async function handleContactStatus(id: string, status: ContactSubmission["status"]) {
    const res = await fetch("/api/contact", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNotif("✗ " + (json.error || "Failed to update contact"));
      return;
    }
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  }

  async function handleSettingsSave() {
    setSaving(true);
    setNotif(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setNotif("✓ Settings saved!");
      } else {
        const json = await res.json();
        throw new Error(json.error || "Failed to save");
      }
    } catch (err: unknown) {
      setNotif("✗ " + (err instanceof Error ? err.message : "Failed to save settings"));
    } finally {
      setSaving(false);
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

  async function handleDeleteAllOrders() {
    if (!orders.length) {
      setNotif("✗ No orders to delete");
      return;
    }
    if (!confirm("This will permanently delete ALL orders. Continue?")) return;
    if (!confirm("Final confirmation: this cannot be undone. Proceed?")) return;

    setBulkWorking(true);
    setNotif(null);
    try {
      const res = await fetch("/api/orders", { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Failed to delete all orders");
      }
      setOrders([]);
      setNotif("✓ All orders deleted");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete all orders";
      setNotif("✗ " + message);
    } finally {
      setBulkWorking(false);
    }
  }

  async function handleAccountCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setNotif(null);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(accountForm),
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      if (!res.ok) {
        const errMsg = Array.isArray(json.error)
          ? json.error.map((e: {path?: string[], message?: string}) => `${e.path?.join(".")||"field"}: ${e.message}`).join(", ")
          : json.error || `Failed to create account (HTTP ${res.status})`;
        throw new Error(errMsg);
      }
      setAccounts((prev) => [...prev, json.account]);
      setAccountForm({ package_id: "", username: "", password: "" });
      // Refresh orders to show account_id assignment
      fetch("/api/orders")
        .then((r) => r.json())
        .then((data) => setOrders(data.orders ?? []))
        .catch(() => {});
      setNotif(json.auto_assigned 
        ? "✓ Account added & assigned to pending order" 
        : "✓ Account added (no pending orders to assign)");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create account";
      setNotif("✗ " + message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAccountDelete(id: string) {
    if (!confirm("Delete this account?")) return;
    await fetch(`/api/accounts?id=${id}`, { method: "DELETE", credentials: "include" });
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setNotif("✓ Account deleted");
  }

  async function handleDeleteAllPackages() {
    if (!confirm("This will permanently delete ALL packages and ALL orders. Continue?")) return;
    if (!confirm("Final confirmation: this cannot be undone. Proceed?")) return;

    setBulkWorking(true);
    setNotif(null);
    try {
      const res = await fetch("/api/packages?all=true", { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Failed to delete all packages");
      }
      setPackages([]);
      setNotif("✓ All packages deleted");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete all packages";
      setNotif("✗ " + message);
    } finally {
      setBulkWorking(false);
    }
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: ShoppingCart },
    { id: "packages", label: "Packages", icon: Package },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "profiles", label: "Profiles", icon: Package },
    { id: "accounts", label: "Accounts", icon: Package },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "contacts", label: "Form Submissions", icon: Mail },
    { id: "settings", label: "Links & Settings", icon: Settings },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      {/* Memory warning banner */}
      {usingMemory && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 text-sm">
          <p className="font-semibold text-yellow-400">⚠️ Database tables not fully set up</p>
          <p className="text-foreground-muted mt-1">
            Some data may be using in-memory fallback or demo mode. Packages and submissions may not persist after server restart. 
            Run the SQL in <code className="bg-black/30 px-1 rounded">supabase-schema.sql</code> in your Supabase SQL Editor to set up all tables properly.
          </p>
        </div>
      )}
      
      {/* Header */}
      <section className="glass-card p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-foreground-muted">Manage orders, packages, reviews, and settings</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost flex items-center gap-2 text-sm" onClick={() => window.location.reload()}>
              <RefreshCw size={16} /> Refresh
            </button>
            <button className="btn-primary flex items-center gap-2 text-sm" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-accent text-white"
                : "glass-card hover:bg-[var(--glass-bg)]"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.id === "contacts" && stats.newContacts > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.newContacts}</span>
            )}
            {tab.id === "orders" && stats.pendingOrders > 0 && (
              <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full">{stats.pendingOrders}</span>
            )}
            {tab.id === "reviews" && stats.pendingReviews > 0 && (
              <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.pendingReviews}</span>
            )}
          </button>
        ))}
      </div>

      {/* Notification */}
      {notif && (
        <div className={`p-3 rounded-lg text-sm ${notif.startsWith("✓") ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
          {notif}
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <section className="grid gap-4 md:grid-cols-4">
          <div className="glass-card p-6 border border-[color:var(--border)]">
            <p className="text-sm text-foreground-muted">Total Orders</p>
            <div className="text-4xl font-bold mt-1">{stats.totalOrders}</div>
          </div>
          <div className="glass-card p-6 border border-[color:var(--border)]">
            <p className="text-sm text-foreground-muted">Confirmed Orders</p>
            <div className="text-4xl font-bold mt-1 text-green-400">{stats.confirmedOrders}</div>
          </div>
          <div className="glass-card p-6 border border-[color:var(--border)]">
            <p className="text-sm text-foreground-muted">Total Sales</p>
            <div className="text-4xl font-bold mt-1 text-accent">{formatCurrency(stats.totalSales)}</div>
          </div>
          <div className="glass-card p-6 border border-[color:var(--border)]">
            <p className="text-sm text-foreground-muted">Active Packages</p>
            <div className="text-4xl font-bold mt-1">{packages.filter(p => p.status === "active").length}</div>
          </div>
        </section>
      )}

      {/* PACKAGES TAB */}
      {activeTab === "packages" && (
        <section className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Manage Packages</h2>
            <div className="flex items-center gap-2">
              <button className="btn-ghost text-sm flex items-center gap-2" onClick={() => exportCsv(packages, "packages.csv")}>
                <Download size={16} /> Export CSV
              </button>
              <button
                className="btn-ghost text-sm flex items-center gap-2 text-red-400 border-red-500/40 hover:border-red-500/70"
                onClick={handleDeleteAllPackages}
                disabled={bulkWorking}
                title="Delete all packages"
              >
                <Trash size={16} /> {bulkWorking ? "Working..." : "Delete All Packages"}
              </button>
            </div>
          </div>

          {/* Package Form */}
          <form className="grid gap-4 md:grid-cols-2 p-4 border border-dashed border-[color:var(--border)] rounded-lg" onSubmit={handlePackageSave}>
            <div className="md:col-span-2 text-sm font-medium text-foreground-muted">
              {pkgForm.id && packages.find(p => p.id === pkgForm.id) ? "Edit Package" : "Create New Package"}
            </div>
            
            <label className="space-y-1 text-sm">
              <span>Name</span>
              <input
                className="glass-input"
                value={pkgForm.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                  setPkgForm({ ...pkgForm, name, id: pkgForm.id || slug });
                }}
                required
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>ID (slug)</span>
              <input className="glass-input" value={pkgForm.id} onChange={(e) => setPkgForm({ ...pkgForm, id: e.target.value })} required />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span>Description</span>
              <textarea className="glass-input min-h-16" value={pkgForm.description} onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })} required />
            </label>
            <label className="space-y-1 text-sm">
              <span>Price (৳ Taka)</span>
              <input className="glass-input" type="number" value={pkgForm.price} onChange={(e) => setPkgForm({ ...pkgForm, price: Number(e.target.value) })} />
            </label>
            <label className="space-y-1 text-sm">
              <span>Status</span>
              <select className="glass-input" value={pkgForm.status} onChange={(e) => setPkgForm({ ...pkgForm, status: e.target.value as PackageRecord["status"] })}>
                <option value="active">Active</option>
                <option value="hidden">Hidden</option>
                <option value="inactive">Inactive</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span>Features (comma or newline separated)</span>
              <textarea
                className="glass-input min-h-[80px]"
                placeholder="Feature 1, Feature 2
Feature 3
Feature 4"
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                onBlur={() => {
                  const parsed = featuresText
                    .split(/[,\n]+/)
                    .map((f) => f.trim())
                    .filter(Boolean);
                  setPkgForm({ ...pkgForm, features: parsed });
                }}
              />
              <span className="text-xs text-foreground-muted">Current: {pkgForm.features.length} feature(s)</span>
            </label>
            <label className="space-y-1 text-sm">
              <span>Group Links (per package)</span>
              <input className="glass-input mb-1" placeholder="WhatsApp URL" value={pkgForm.groups.whatsapp ?? ""} onChange={(e) => setPkgForm({ ...pkgForm, groups: { ...pkgForm.groups, whatsapp: e.target.value } })} />
              <input className="glass-input mb-1" placeholder="Telegram URL" value={pkgForm.groups.telegram ?? ""} onChange={(e) => setPkgForm({ ...pkgForm, groups: { ...pkgForm.groups, telegram: e.target.value } })} />
              <input className="glass-input" placeholder="Facebook URL" value={pkgForm.groups.facebook ?? ""} onChange={(e) => setPkgForm({ ...pkgForm, groups: { ...pkgForm.groups, facebook: e.target.value } })} />
            </label>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
                <Plus size={16} /> {saving ? "Saving..." : pkgForm.id && packages.find(p => p.id === pkgForm.id) ? "Update Package" : "Create Package"}
              </button>
              {pkgForm.id && packages.find(p => p.id === pkgForm.id) && (
                <button type="button" className="btn-ghost" onClick={() => { setPkgForm({ id: "", name: "", description: "", price: 0, currency: "BDT", status: "active", features: [], groups: {} }); setFeaturesText(""); }}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Packages List */}
          <div className="grid gap-4 md:grid-cols-2">
            {packages.map((pkg) => (
              <div key={pkg.id} className="glass-card p-4 border border-[color:var(--border)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase text-foreground-muted">{pkg.id}</div>
                    <div className="text-lg font-semibold">{pkg.name}</div>
                    <p className="text-sm text-foreground-muted line-clamp-2">{pkg.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-accent">{formatCurrency(pkg.price)}</div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      pkg.status === "active" ? "bg-green-500/20 text-green-400" :
                      pkg.status === "upcoming" ? "bg-blue-500/20 text-blue-400" :
                      pkg.status === "hidden" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-gray-500/20 text-gray-400"
                    }`}>
                      {pkg.status}
                    </span>
                  </div>
                </div>
                {pkg.features?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {pkg.features.map((f) => (
                      <span key={f} className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">{f}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-3 pt-3 border-t border-[color:var(--border)]">
                  <button className="btn-primary text-xs" onClick={() => { setPkgForm(pkg); setFeaturesText(pkg.features?.join(", ") || ""); }}>Edit</button>
                  <button className="btn-ghost text-xs text-red-400 flex items-center gap-1" onClick={() => handleDelete(pkg.id)}>
                    <Trash size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
            {!packages.length && <p className="text-foreground-muted">No packages yet. Create one above.</p>}
          </div>
        </section>
      )}

      {/* ORDERS TAB */}
      {activeTab === "orders" && (
        <section className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Orders ({orders.length})</h2>
            <div className="flex items-center gap-2">
              <button className="btn-ghost text-sm flex items-center gap-2" onClick={() => exportCsv(orders, "orders.csv")}>
                <Download size={16} /> Export CSV
              </button>
              <button
                className="btn-ghost text-sm flex items-center gap-2 text-red-400 border-red-500/40 hover:border-red-500/70"
                onClick={handleDeleteAllOrders}
                disabled={bulkWorking || !orders.length}
                title="Delete all orders"
              >
                <Trash size={16} /> {bulkWorking ? "Working..." : "Delete All Orders"}
              </button>
            </div>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-foreground-muted border-b border-[color:var(--border)]">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Package</th>
                  <th className="p-3">Transaction ID</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-[color:var(--border)] hover:bg-[var(--glass-bg)]">
                    <td className="p-3">
                      <div className="font-medium">{order.full_name}</div>
                      {order.user_name && <div className="text-xs text-foreground-muted">Username: {order.user_name}</div>}
                      {order.user_id && <div className="text-xs text-foreground-muted">User ID: {order.user_id}</div>}
                      <div className="text-xs text-foreground-muted">{order.source}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-xs">{order.email}</div>
                      <div className="text-xs text-foreground-muted">{order.mobile}</div>
                    </td>
                    <td className="p-3 font-medium">{order.package_id}</td>
                    <td className="p-3 font-mono text-xs">{order.transaction_id}</td>
                    <td className="p-3 font-bold">{formatCurrency(order.price ?? 0)}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        order.status === "approved" ? "bg-green-500/20 text-green-400" :
                        order.status === "rejected" ? "bg-red-500/20 text-red-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {order.status}
                      </span>
                      {order.status === "approved" && (
                        <div className={`text-xs mt-1 ${order.account_id ? "text-green-400" : "text-orange-400"}`}>
                          {order.account_id 
                            ? `✓ Account: ${order.account_id.slice(0, 8)}...` 
                            : "⏳ Awaiting account"}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button
                          className="p-1.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          onClick={() => handleOrderStatus(order.id, "approved")}
                          title="Approve"
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button
                          className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          onClick={() => handleOrderStatus(order.id, "rejected")}
                          title="Reject"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!orders.length && (
              <p className="text-center p-6 text-foreground-muted">No orders yet.</p>
            )}
          </div>
        </section>
      )}

      {/* PROFILES TAB */}
      {activeTab === "profiles" && (
        <section className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Profiles ({profiles.length})</h2>
            <button className="btn-ghost text-sm flex items-center gap-2" onClick={() => exportCsv(profiles, "profiles.csv")}>
              <Download size={16} /> Export CSV
            </button>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-foreground-muted border-b border-[color:var(--border)]">
                <tr>
                  <th className="p-3">Profile ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Mobile</th>
                  <th className="p-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id} className="border-b border-[color:var(--border)] hover:bg-[var(--glass-bg)]">
                    <td className="p-3 font-mono text-xs">#{String(profile.profile_number).padStart(4, "0")}</td>
                    <td className="p-3">{profile.full_name}</td>
                    <td className="p-3 text-xs">{profile.email}</td>
                    <td className="p-3 text-xs">{profile.mobile}</td>
                    <td className="p-3 text-xs text-foreground-muted">
                      {profile.created_at ? new Date(profile.created_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!profiles.length && (
              <p className="text-center p-6 text-foreground-muted">No profiles yet.</p>
            )}
          </div>
        </section>
      )}

      {/* ACCOUNTS TAB */}
      {activeTab === "accounts" && (
        <section className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Package Accounts</h2>
            <button className="btn-ghost text-sm flex items-center gap-2" onClick={() => exportCsv(accounts, "package_accounts.csv")}>
              <Download size={16} /> Export CSV
            </button>
          </div>

          <form className="grid gap-4 md:grid-cols-2 p-4 border border-dashed border-[color:var(--border)] rounded-lg" onSubmit={handleAccountCreate}>
            <div className="md:col-span-2 text-sm font-medium text-foreground-muted">Add Account</div>
            <label className="space-y-1 text-sm">
              <span>Package</span>
              <select
                className="glass-input"
                value={accountForm.package_id}
                onChange={(e) => setAccountForm({ ...accountForm, package_id: e.target.value })}
                required
              >
                <option value="">Select package</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>{pkg.name} ({pkg.id})</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span>Username / Email</span>
              <input
                className="glass-input"
                value={accountForm.username}
                onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                required
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>Password</span>
              <input
                className="glass-input"
                value={accountForm.password}
                onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                required
              />
            </label>
            <div className="md:col-span-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Add Account"}
              </button>
            </div>
          </form>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-foreground-muted border-b border-[color:var(--border)]">
                <tr>
                  <th className="p-3">Package</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Password</th>
                  <th className="p-3">Assigned To</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id} className="border-b border-[color:var(--border)] hover:bg-[var(--glass-bg)]">
                    <td className="p-3">{acc.package_id}</td>
                    <td className="p-3 font-mono text-xs break-all">{acc.username}</td>
                    <td className="p-3 font-mono text-xs break-all">{acc.password}</td>
                    <td className="p-3 text-xs">
                      {acc.assigned_order_id
                        ? (() => {
                            const order = orders.find((o) => o.id === acc.assigned_order_id);
                            if (!order) return acc.assigned_order_id.slice(0, 8);
                            const profile = order.profile_number
                              ? `#${String(order.profile_number).padStart(4, "0")}`
                              : "No profile ID";
                            return `${order.full_name} (${profile})`;
                          })()
                        : "—"}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        acc.status === "available" ? "bg-green-500/20 text-green-400" :
                        acc.status === "assigned" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-red-500/20 text-red-400"
                      }`}>
                        {acc.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button className="btn-ghost text-xs text-red-400" onClick={() => handleAccountDelete(acc.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!accounts.length && (
              <p className="text-center p-6 text-foreground-muted">No accounts added yet.</p>
            )}
          </div>
        </section>
      )}

      {/* REVIEWS TAB */}
      {activeTab === "reviews" && (
        <section className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Reviews ({reviews.length})</h2>
            <button className="btn-ghost text-sm flex items-center gap-2" onClick={() => exportCsv(reviews, "reviews.csv")}>
              <Download size={16} /> Export CSV
            </button>
          </div>
          <p className="text-sm text-foreground-muted">Approve reviews to show them on the public reviews page. Pending reviews are hidden from users.</p>
          <div className="grid gap-4">
            {reviews.map((review) => (
              <div key={review.id} className={`glass-card p-4 border ${review.status === "pending" ? "border-orange-500/50" : review.status === "approved" ? "border-green-500/50" : "border-red-500/50"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{review.name}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} size={14} className={star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-500"} />
                        ))}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        review.status === "pending" ? "bg-orange-500/20 text-orange-400" :
                        review.status === "approved" ? "bg-green-500/20 text-green-400" :
                        "bg-red-500/20 text-red-400"
                      }`}>
                        {review.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{review.comment}</p>
                    {review.source && <p className="text-xs text-foreground-muted mt-1">Source: {review.source}</p>}
                    {review.created_at && (
                      <div className="text-xs text-foreground-muted mt-1">
                        {new Date(review.created_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {review.status !== "approved" && (
                      <button
                        className="btn-primary text-xs flex items-center gap-1"
                        onClick={() => handleReviewStatus(review.id, "approved")}
                      >
                        <CheckCircle size={12} /> Approve
                      </button>
                    )}
                    {review.status !== "rejected" && (
                      <button
                        className="btn-ghost text-xs text-red-400 flex items-center gap-1"
                        onClick={() => handleReviewStatus(review.id, "rejected")}
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!reviews.length && (
              <p className="text-center p-6 text-foreground-muted">No reviews yet.</p>
            )}
          </div>
        </section>
      )}

      {/* CONTACTS TAB */}
      {activeTab === "contacts" && (
        <section className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Contact Form Submissions ({contacts.length})</h2>
            <button className="btn-ghost text-sm flex items-center gap-2" onClick={() => exportCsv(contacts, "contacts.csv")}>
              <Download size={16} /> Export CSV
            </button>
          </div>
          <div className="grid gap-4">
            {contacts.map((contact) => (
              <div key={contact.id} className={`glass-card p-4 border ${contact.status === "new" ? "border-accent" : "border-[color:var(--border)]"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{contact.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        contact.status === "new" ? "bg-accent/20 text-accent" :
                        contact.status === "read" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-green-500/20 text-green-400"
                      }`}>
                        {contact.status}
                      </span>
                    </div>
                    <div className="text-sm text-foreground-muted mt-1">
                      <span>{contact.email}</span> • <span>{contact.mobile}</span>
                    </div>
                    <p className="mt-2 text-sm bg-[var(--glass-bg)] p-3 rounded">{contact.message}</p>
                    {contact.created_at && (
                      <div className="text-xs text-foreground-muted mt-2">
                        {new Date(contact.created_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {contact.status === "new" && (
                      <button
                        className="btn-ghost text-xs"
                        onClick={() => handleContactStatus(contact.id, "read")}
                      >
                        Mark Read
                      </button>
                    )}
                    {contact.status !== "resolved" && (
                      <button
                        className="btn-primary text-xs"
                        onClick={() => handleContactStatus(contact.id, "resolved")}
                      >
                        Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!contacts.length && (
              <p className="text-center p-6 text-foreground-muted">No contact submissions yet.</p>
            )}
          </div>
        </section>
      )}

      {/* SETTINGS TAB */}
      {activeTab === "settings" && (
        <section className="glass-card p-6 space-y-6">
          <h2 className="text-xl font-semibold">Site Links & Settings</h2>
          <p className="text-sm text-foreground-muted">Set your global social links, payment info, and contact details.</p>
          
          {/* Payment Number - Important field */}
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg space-y-2">
            <label className="space-y-1 text-sm">
              <span className="font-semibold text-cyan-400">💳 Payment Number (bKash/Nagad)</span>
              <input
                className="glass-input text-lg font-semibold"
                placeholder="+880 1XXX-XXXXXX"
                value={settings.payment_number ?? ""}
                onChange={(e) => setSettings({ ...settings, payment_number: e.target.value })}
              />
              <p className="text-xs text-foreground-muted">This number will be displayed on the Purchase page for customers to send payment.</p>
            </label>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span>WhatsApp Link</span>
              <input
                className="glass-input"
                placeholder="https://wa.me/1234567890"
                value={settings.whatsapp_link ?? ""}
                onChange={(e) => setSettings({ ...settings, whatsapp_link: e.target.value })}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>Telegram Link</span>
              <input
                className="glass-input"
                placeholder="https://t.me/yourgroup"
                value={settings.telegram_link ?? ""}
                onChange={(e) => setSettings({ ...settings, telegram_link: e.target.value })}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>Facebook Link</span>
              <input
                className="glass-input"
                placeholder="https://fb.com/yourpage"
                value={settings.facebook_link ?? ""}
                onChange={(e) => setSettings({ ...settings, facebook_link: e.target.value })}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>Support Email</span>
              <input
                className="glass-input"
                placeholder="support@example.com"
                value={settings.support_email ?? ""}
                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
              />
            </label>
          </div>

          <button className="btn-primary" onClick={handleSettingsSave} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </button>
          
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
            <p className="font-semibold text-yellow-400">⚠️ Note:</p>
            <p className="text-foreground-muted">Settings require the <code>site_settings</code> table in Supabase. If saving fails, run the SQL provided in <code>add-new-tables.sql</code>.</p>
          </div>
        </section>
      )}
    </div>
  );
}
