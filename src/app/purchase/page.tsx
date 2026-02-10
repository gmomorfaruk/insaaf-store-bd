"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import { PackageRecord } from "@/lib/types";
import { z } from "zod";
import { useLanguage } from "@/lib/language-context";

const orderSchema = z.object({
  full_name: z.string().min(2),
  user_name: z.string().optional(),
  user_id: z.string().optional(),
  email: z.string().email(),
  mobile: z.string().min(6),
  package_id: z.string(),
  source: z.enum(["WhatsApp", "Facebook", "Telegram", "Website"]),
  transaction_id: z.string().min(4),
});

type OrderForm = z.infer<typeof orderSchema>;

export default function PurchasePage() {
  const { t } = useLanguage();
  const [packages, setPackages] = useState<PackageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentNumber, setPaymentNumber] = useState<string>("");
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  
  const [form, setForm] = useState<OrderForm>({
    full_name: "",
    user_name: "",
    user_id: "",
    email: "",
    mobile: "",
    package_id: "",
    source: "Website",
    transaction_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch packages from database
  useEffect(() => {
    async function loadPackages() {
      try {
        const res = await fetch("/api/packages");
        const json = await res.json();
        // Filter only active packages
        const active = (json.packages ?? []).filter((p: PackageRecord) => p.status === "active");
        setPackages(active);
        // Set first package as default if available
        if (active.length > 0) {
          setForm(f => ({ ...f, package_id: active[0].id }));
        }
      } catch {
        setPackages([]);
      } finally {
        setLoading(false);
      }
    }
    loadPackages();
  }, []);

  // Fetch payment number from settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        const json = await res.json();
        if (json.settings?.payment_number) {
          setPaymentNumber(json.settings.payment_number);
        }
      } catch {
        // Keep default empty
      }
    }
    loadSettings();
  }, []);

  // Slow down background video
  useEffect(() => {
    if (bgVideoRef.current) {
      bgVideoRef.current.playbackRate = 0.5;
    }
  }, []);

  const selectedPackage = packages.find((p) => p.id === form.package_id);
  const price = selectedPackage?.price ?? 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const parsed = orderSchema.safeParse(form);
    if (!parsed.success) {
      setError(t("purchase.completeFields"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, price }),
      });
      if (!res.ok) {
        throw new Error("Failed to submit order");
      }
      setMessage(t("purchase.submitted"));
      setForm({ ...form, transaction_id: "" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-12 sm:px-10 relative page-video-bg">
      <div className="page-video-bg__media" aria-hidden="true">
        <video
          ref={bgVideoRef}
          className="page-video-bg__video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src="/pkg.mp4" type="video/mp4" />
        </video>
        <div className="page-video-bg__overlay" />
      </div>
      <div className="glass-card card-hover p-8 space-y-4">
        <div className="pill text-sm">{t("purchase.secureCheckout")}</div>
        <h1 className="text-3xl font-semibold">{t("purchase.title")}</h1>
        <p className="text-foreground-muted">
          {t("purchase.subtitle")}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="glass-card p-4 border border-[color:var(--border)]">
            <p className="text-sm text-foreground-muted">{t("purchase.paymentNumber")}</p>
            <p className="text-xl font-semibold">{paymentNumber || t("purchase.paymentPlaceholder")}</p>
          </div>
          <div className="glass-card p-4 border border-[color:var(--border)]">
            <p className="text-sm text-foreground-muted">{t("purchase.reminder")}</p>
            <p className="text-sm">{t("purchase.reminderText")}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-8 text-center text-foreground-muted">
          {t("home.loadingPackages")}
        </div>
      ) : packages.length === 0 ? (
        <div className="glass-card p-8 text-center text-foreground-muted">
          {t("purchase.noPackages")}
        </div>
      ) : (
        <form className="glass-card card-hover p-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span>{t("purchase.fullName")}</span>
              <input
                className="glass-input"
                placeholder={t("purchase.namePlaceholder")}
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </label>
            <label className="space-y-2 text-sm">
              <span>{t("purchase.email")}</span>
              <input
                className="glass-input"
                placeholder={t("purchase.emailPlaceholder")}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span>{t("purchase.userName")}</span>
              <input
                className="glass-input"
                placeholder={t("purchase.userNamePlaceholder")}
                value={form.user_name}
                onChange={(e) => setForm({ ...form, user_name: e.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm">
              <span>{t("purchase.userId")}</span>
              <input
                className="glass-input"
                placeholder={t("purchase.userIdPlaceholder")}
                value={form.user_id}
                onChange={(e) => setForm({ ...form, user_id: e.target.value })}
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-2 text-sm sm:col-span-2">
              <span>{t("purchase.mobile")}</span>
              <input
                className="glass-input"
                placeholder={t("purchase.mobilePlaceholder")}
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                required
              />
            </label>
            <label className="space-y-2 text-sm">
              <span>{t("purchase.source")}</span>
              <select
                className="glass-input"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value as OrderForm["source"] })}
              >
                {(["WhatsApp", "Facebook", "Telegram", "Website"] as const).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span>{t("purchase.package")}</span>
              <select
                className="glass-input"
                value={form.package_id}
                onChange={(e) => setForm({ ...form, package_id: e.target.value })}
              >
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} (৳{pkg.price})
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span>{t("purchase.packagePrice")}</span>
              <input className="glass-input" value={`৳${price}`} disabled />
            </label>
          </div>
          <label className="space-y-2 text-sm">
            <span>{t("purchase.transactionId")}</span>
            <input
              className="glass-input"
              placeholder={t("purchase.transactionPlaceholder")}
              value={form.transaction_id}
              onChange={(e) => setForm({ ...form, transaction_id: e.target.value })}
              required
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-emerald-400">{message}</p>}
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? t("purchase.submitting") : t("purchase.submit")}
            </button>
            <Link href="/" className="text-sm text-foreground-muted">
              {t("purchase.backToHome")}
            </Link>
          </div>
        </form>
      )}
      <FloatingChatbot />
    </main>
  );
}
