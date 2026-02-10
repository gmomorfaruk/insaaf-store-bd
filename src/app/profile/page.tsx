"use client";

import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/lib/language-context";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import Link from "next/link";
import Script from "next/script";
import {
  User,
  Mail,
  Phone,
  ShoppingBag,
  LogOut,
  Eye,
  EyeOff,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  UserPlus,
  LogIn,
  Package,
  Key,
} from "lucide-react";

// Declare VANTA on window for TypeScript
declare global {
  interface Window {
    VANTA?: {
      BIRDS: (config: Record<string, unknown>) => { destroy: () => void };
    };
  }
}

type Profile = {
  id: string;
  profile_number: number;
  profile_id?: string;
  full_name: string;
  email: string;
  mobile: string;
};

type OrderItem = {
  id: string;
  package_id: string;
  transaction_id: string;
  price: number;
  currency?: string;
  status: "pending" | "approved" | "rejected";
  created_at?: string;
  account?: { username: string; password: string } | null;
  package?:
    | {
        name: string;
        name_bn?: string;
        description?: string;
        description_bn?: string;
      }
    | null;
};

export default function ProfilePage() {
  const { language } = useLanguage();
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<{ destroy: () => void } | null>(null);
  const [vantaLoaded, setVantaLoaded] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    full_name: "",
    email: "",
    password: "",
    mobile: "",
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Initialize Vanta.js birds effect
  useEffect(() => {
    if (!vantaLoaded || !vantaRef.current || vantaEffect.current) return;

    if (window.VANTA) {
      vantaEffect.current = window.VANTA.BIRDS({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        backgroundColor: 0x0a0a0f,
        color1: 0xff0066,
        color2: 0x00d4ff,
        colorMode: "varianceGradient",
        quantity: 4,
        birdSize: 1.2,
        wingSpan: 25,
        speedLimit: 4,
        separation: 30,
        alignment: 30,
        cohesion: 25,
      });
    }

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, [vantaLoaded]);

  async function loadProfile() {
    setLoading(true);
    try {
      const res = await fetch("/api/profile/me", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        setProfile(null);
        setOrders([]);
        return;
      }
      const json = await res.json();
      setProfile(json.profile ?? null);
      await loadOrders();
    } finally {
      setLoading(false);
    }
  }

  async function loadOrders() {
    const res = await fetch("/api/profile/orders", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) {
      setOrders([]);
      return;
    }
    const json = await res.json();
    setOrders(json.orders ?? []);
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function toErrorMessage(err: unknown) {
    if (!err) return "Something went wrong.";
    if (typeof err === "string") return err;
    if (Array.isArray(err)) {
      return err
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "message" in item) {
            return String((item as { message?: string }).message ?? "Invalid input");
          }
          return "Invalid input";
        })
        .join(", ");
    }
    if (typeof err === "object") {
      if ("message" in err) return String((err as { message?: string }).message ?? "Error");
      return "Invalid request.";
    }
    return "Error";
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/profile/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(loginForm),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(toErrorMessage(json.error));
      return;
    }
    setProfile(json.profile);
    await loadOrders();
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/profile/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(registerForm),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(toErrorMessage(json.error));
      return;
    }
    setProfile(json.profile);
    await loadOrders();
  }

  async function handleLogout() {
    await fetch("/api/profile/logout", { method: "POST", credentials: "include" });
    setProfile(null);
    setOrders([]);
  }

  const getPackageName = (order: OrderItem) => {
    if (!order.package) return order.package_id;
    return language === "bn" && order.package.name_bn ? order.package.name_bn : order.package.name;
  };

  const togglePasswordVisibility = (orderId: string) => {
    setShowPasswords((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={16} className="text-green-400" />;
      case "rejected":
        return <XCircle size={16} className="text-red-400" />;
      default:
        return <Clock size={16} className="text-yellow-400" />;
    }
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, { en: string; bn: string }> = {
      approved: { en: "Approved", bn: "অনুমোদিত" },
      rejected: { en: "Rejected", bn: "প্রত্যাখ্যাত" },
      pending: { en: "Pending", bn: "অপেক্ষমান" },
    };
    return language === "bn" ? texts[status]?.bn : texts[status]?.en;
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12 relative overflow-hidden">
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.birds.min.js"
        strategy="afterInteractive"
        onLoad={() => setVantaLoaded(true)}
      />

      <div
        ref={vantaRef}
        className="fixed inset-0 -z-10"
        style={{
          background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)",
        }}
      />
      <div className="fixed inset-0 -z-10 bg-black/30 backdrop-blur-[1px]" />

      <div className="mx-auto max-w-4xl space-y-6 relative z-10">
        <div className="glass-card card-hover p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-600 flex items-center justify-center">
              <User size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                {language === "bn" ? "আপনার প্রোফাইল" : "Your Profile"}
              </h1>
              <p className="text-foreground-muted text-sm">
                {language === "bn"
                  ? "আপনার অর্ডার এবং অ্যাকাউন্ট তথ্য পরিচালনা করুন"
                  : "Manage your orders and account credentials"}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="glass-card p-12 text-center">
            <div className="inline-flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              <span className="text-foreground-muted">{language === "bn" ? "লোড হচ্ছে..." : "Loading..."}</span>
            </div>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            <div className="glass-card card-hover p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Shield size={28} className="text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-foreground-muted uppercase tracking-wider mb-1">
                      {language === "bn" ? "প্রোফাইল আইডি" : "Profile ID"}
                    </div>
                    <div className="text-3xl font-bold text-[var(--accent)]">
                      #{String(profile.profile_number).padStart(4, "0")}
                    </div>
                  </div>
                </div>
                <button
                  className="btn-ghost flex items-center gap-2 text-red-400 border-red-500/30 hover:border-red-500/60 hover:bg-red-500/10"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  {language === "bn" ? "লগআউট" : "Logout"}
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="glass-card p-4 border border-[color:var(--border)]">
                  <div className="flex items-center gap-2 text-foreground-muted mb-2">
                    <User size={14} />
                    <span className="text-xs uppercase tracking-wider">{language === "bn" ? "নাম" : "Name"}</span>
                  </div>
                  <div className="font-semibold">{profile.full_name}</div>
                </div>
                <div className="glass-card p-4 border border-[color:var(--border)]">
                  <div className="flex items-center gap-2 text-foreground-muted mb-2">
                    <Mail size={14} />
                    <span className="text-xs uppercase tracking-wider">{language === "bn" ? "ইমেইল" : "Email"}</span>
                  </div>
                  <div className="font-semibold text-sm break-all">{profile.email}</div>
                </div>
                <div className="glass-card p-4 border border-[color:var(--border)]">
                  <div className="flex items-center gap-2 text-foreground-muted mb-2">
                    <Phone size={14} />
                    <span className="text-xs uppercase tracking-wider">{language === "bn" ? "মোবাইল" : "Mobile"}</span>
                  </div>
                  <div className="font-semibold">{profile.mobile}</div>
                </div>
              </div>
            </div>

            <div className="glass-card card-hover p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <ShoppingBag size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{language === "bn" ? "আপনার অর্ডার" : "Your Orders"}</h2>
                  <p className="text-xs text-foreground-muted">
                    {orders.length} {language === "bn" ? "টি অর্ডার" : orders.length === 1 ? "order" : "orders"}
                  </p>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--glass-bg)] flex items-center justify-center">
                    <Package size={28} className="text-foreground-muted" />
                  </div>
                  <p className="text-foreground-muted mb-4">{language === "bn" ? "এখনও কোনো অর্ডার নেই" : "No orders yet"}</p>
                  <Link href="/purchase" className="btn-primary inline-flex items-center gap-2">
                    <ShoppingBag size={16} />
                    {language === "bn" ? "প্যাকেজ কিনুন" : "Purchase a Package"}
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className={`glass-card p-5 border-l-4 transition-all ${
                        order.status === "approved"
                          ? "border-l-green-500 bg-green-500/5"
                          : order.status === "rejected"
                          ? "border-l-red-500 bg-red-500/5"
                          : "border-l-yellow-500 bg-yellow-500/5"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              order.status === "approved"
                                ? "bg-green-500/20"
                                : order.status === "rejected"
                                ? "bg-red-500/20"
                                : "bg-yellow-500/20"
                            }`}
                          >
                            {getStatusIcon(order.status)}
                          </div>
                          <div>
                            <div className="font-semibold">{getPackageName(order)}</div>
                            <div className="text-xs text-foreground-muted">{formatDate(order.created_at)}</div>
                          </div>
                        </div>
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                            order.status === "approved"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : order.status === "rejected"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          }`}
                        >
                          {getStatusIcon(order.status)}
                          {getStatusText(order.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                        <div>
                          <span className="text-foreground-muted">
                            {language === "bn" ? "ট্রানজেকশন আইডি" : "Transaction ID"}:
                          </span>
                          <span className="ml-2 font-mono text-xs">{order.transaction_id}</span>
                        </div>
                        <div>
                          <span className="text-foreground-muted">{language === "bn" ? "মূল্য" : "Price"}:</span>
                          <span className="ml-2 font-semibold">৳{order.price}</span>
                        </div>
                      </div>

                      {order.status === "approved" && order.account ? (
                        <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                          <div className="flex items-center gap-2 mb-4">
                            <Key size={16} className="text-green-400" />
                            <span className="text-sm font-semibold text-green-400">
                              {language === "bn" ? "অ্যাকাউন্ট তথ্য" : "Account Credentials"}
                            </span>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-black/20 border border-[color:var(--border)]">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-foreground-muted mb-1">
                                  {language === "bn" ? "ইউজারনেম / ইমেইল" : "Username / Email"}
                                </div>
                                <div className="font-mono text-sm break-all">{order.account.username}</div>
                              </div>
                              <button
                                onClick={() => copyToClipboard(order.account!.username, `${order.id}-user`)}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                title="Copy"
                                type="button"
                              >
                                {copiedField === `${order.id}-user` ? (
                                  <Check size={16} className="text-green-400" />
                                ) : (
                                  <Copy size={16} className="text-foreground-muted" />
                                )}
                              </button>
                            </div>

                            <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-black/20 border border-[color:var(--border)]">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-foreground-muted mb-1">
                                  {language === "bn" ? "পাসওয়ার্ড" : "Password"}
                                </div>
                                <div className="font-mono text-sm break-all">
                                  {showPasswords[order.id] ? order.account.password : "••••••••"}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => togglePasswordVisibility(order.id)}
                                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                  title={showPasswords[order.id] ? "Hide" : "Show"}
                                  type="button"
                                >
                                  {showPasswords[order.id] ? (
                                    <EyeOff size={16} className="text-foreground-muted" />
                                  ) : (
                                    <Eye size={16} className="text-foreground-muted" />
                                  )}
                                </button>
                                <button
                                  onClick={() => copyToClipboard(order.account!.password, `${order.id}-pass`)}
                                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                  title="Copy"
                                  type="button"
                                >
                                  {copiedField === `${order.id}-pass` ? (
                                    <Check size={16} className="text-green-400" />
                                  ) : (
                                    <Copy size={16} className="text-foreground-muted" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : order.status === "approved" ? (
                        <div className="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                              <Clock size={16} className="text-yellow-400" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-yellow-400">
                                {language === "bn" ? "অ্যাকাউন্ট প্রস্তুত হচ্ছে" : "Account is being prepared"}
                              </div>
                              <div className="text-xs text-foreground-muted">
                                {language === "bn"
                                  ? "শীঘ্রই আপনার অ্যাকাউন্ট তথ্য এখানে দেখা যাবে"
                                  : "Your credentials will appear here shortly"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="glass-card card-hover p-6 sm:p-8 flex flex-col justify-center">
              <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-purple-600 flex items-center justify-center shadow-lg shadow-[var(--accent)]/20">
                <Shield size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3">{language === "bn" ? "স্বাগতম!" : "Welcome!"}</h2>
              <p className="text-foreground-muted mb-6">
                {language === "bn"
                  ? "লগইন করুন আপনার প্রোফাইল আইডি, অর্ডার এবং অনুমোদিত অ্যাকাউন্ট তথ্য দেখতে।"
                  : "Login to view your profile ID, orders, and approved account credentials."}
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <CheckCircle size={16} className="text-green-400" />
                  </div>
                  <span>{language === "bn" ? "অর্ডার স্ট্যাটাস ট্র্যাক করুন" : "Track order status"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Key size={16} className="text-blue-400" />
                  </div>
                  <span>{language === "bn" ? "অ্যাকাউন্ট তথ্য অ্যাক্সেস করুন" : "Access account credentials"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Shield size={16} className="text-purple-400" />
                  </div>
                  <span>{language === "bn" ? "নিরাপদ ও সুরক্ষিত" : "Secure & protected"}</span>
                </div>
              </div>
            </div>

            <div className="glass-card card-hover p-6 sm:p-8">
              <div className="flex gap-2 mb-6 p-1 rounded-xl bg-black/20">
                <button
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    mode === "login"
                      ? "bg-[var(--accent)] text-white shadow-lg"
                      : "text-foreground-muted hover:text-white"
                  }`}
                  onClick={() => setMode("login")}
                  type="button"
                >
                  <LogIn size={16} />
                  {language === "bn" ? "লগইন" : "Login"}
                </button>
                <button
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    mode === "register"
                      ? "bg-[var(--accent)] text-white shadow-lg"
                      : "text-foreground-muted hover:text-white"
                  }`}
                  onClick={() => setMode("register")}
                  type="button"
                >
                  <UserPlus size={16} />
                  {language === "bn" ? "রেজিস্টার" : "Register"}
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                  <XCircle size={16} />
                  {error}
                </div>
              )}

              {mode === "login" ? (
                <form className="space-y-4" onSubmit={handleLogin}>
                  <div>
                    <label className="block text-sm text-foreground-muted mb-2">
                      {language === "bn" ? "ইমেইল" : "Email"}
                    </label>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none"
                      />
                      <input
                        className="glass-input !pl-12"
                        placeholder={language === "bn" ? "আপনার ইমেইল" : "your@email.com"}
                        type="email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-foreground-muted mb-2">
                      {language === "bn" ? "পাসওয়ার্ড" : "Password"}
                    </label>
                    <div className="relative">
                      <Key
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none"
                      />
                      <input
                        className="glass-input !pl-12 !pr-12"
                        placeholder="••••••••"
                        type={showLoginPassword ? "text" : "password"}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-white"
                        aria-label={showLoginPassword ? "Hide password" : "Show password"}
                      >
                        {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button className="btn-primary w-full flex items-center justify-center gap-2" type="submit">
                    <LogIn size={16} />
                    {language === "bn" ? "লগইন করুন" : "Login"}
                  </button>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={handleRegister}>
                  <div>
                    <label className="block text-sm text-foreground-muted mb-2">
                      {language === "bn" ? "পুরো নাম" : "Full Name"}
                    </label>
                    <div className="relative">
                      <User
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none"
                      />
                      <input
                        className="glass-input !pl-12"
                        placeholder={language === "bn" ? "আপনার নাম" : "Your full name"}
                        value={registerForm.full_name}
                        onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-foreground-muted mb-2">
                      {language === "bn" ? "ইমেইল" : "Email"}
                    </label>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none"
                      />
                      <input
                        className="glass-input !pl-12"
                        placeholder={language === "bn" ? "আপনার ইমেইল" : "your@email.com"}
                        type="email"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-foreground-muted mb-2">
                      {language === "bn" ? "মোবাইল" : "Mobile"}
                    </label>
                    <div className="relative">
                      <Phone
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none"
                      />
                      <input
                        className="glass-input !pl-12"
                        placeholder={language === "bn" ? "০১XXXXXXXXX" : "01XXXXXXXXX"}
                        value={registerForm.mobile}
                        onChange={(e) => setRegisterForm({ ...registerForm, mobile: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-foreground-muted mb-2">
                      {language === "bn" ? "পাসওয়ার্ড" : "Password"}
                    </label>
                    <div className="relative">
                      <Key
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none"
                      />
                      <input
                        className="glass-input !pl-12 !pr-12"
                        placeholder="••••••••"
                        type={showRegisterPassword ? "text" : "password"}
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-white"
                        aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                      >
                        {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button className="btn-primary w-full flex items-center justify-center gap-2" type="submit">
                    <UserPlus size={16} />
                    {language === "bn" ? "অ্যাকাউন্ট তৈরি করুন" : "Create Account"}
                  </button>
                </form>
              )}

              <p className="mt-6 text-center text-xs text-foreground-muted">
                {mode === "login" ? (
                  <>
                    {language === "bn" ? "অ্যাকাউন্ট নেই?" : "Don't have an account?"}{" "}
                    <button
                      type="button"
                      onClick={() => setMode("register")}
                      className="text-[var(--accent)] hover:underline"
                    >
                      {language === "bn" ? "রেজিস্টার করুন" : "Register"}
                    </button>
                  </>
                ) : (
                  <>
                    {language === "bn" ? "ইতিমধ্যে অ্যাকাউন্ট আছে?" : "Already have an account?"}{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-[var(--accent)] hover:underline"
                    >
                      {language === "bn" ? "লগইন করুন" : "Login"}
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      <FloatingChatbot />
    </main>
  );
}
