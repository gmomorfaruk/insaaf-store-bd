"use client";

import { useState, useEffect } from "react";
import { Send, CheckCircle, MessageCircle, Mail, Phone } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

type SiteSettings = {
  whatsapp_link: string;
  telegram_link: string;
  facebook_link: string;
  support_email: string;
};

export default function ContactPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", mobile: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SiteSettings>({
    whatsapp_link: "",
    telegram_link: "",
    facebook_link: "",
    support_email: "",
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.settings) {
          setSettings(json.settings);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSettings(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to send message");
      }
      
      setSent(true);
      setForm({ name: "", email: "", mobile: "", message: "" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-6 px-6 py-12 sm:px-10 page-video-bg">
        <div className="page-video-bg__media" aria-hidden="true">
          <video
            className="page-video-bg__video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          >
            <source src="/contact.mp4" type="video/mp4" />
          </video>
          <div className="page-video-bg__overlay" />
        </div>
        <div className="glass-card p-10 text-center space-y-4">
          <CheckCircle size={64} className="mx-auto text-green-400" />
          <h1 className="text-2xl font-semibold">{t("contact.messageSent")}</h1>
          <p className="text-foreground-muted">{t("contact.getBackSoon")}</p>
          <button className="btn-primary" onClick={() => setSent(false)}>
            {t("contact.sendAnother")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-12 sm:px-10 page-video-bg">
      <div className="page-video-bg__media" aria-hidden="true">
        <video
          className="page-video-bg__video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src="/contact.mp4" type="video/mp4" />
        </video>
        <div className="page-video-bg__overlay" />
      </div>
      <header className="glass-card card-hover p-8 space-y-4">
        <div className="pill text-sm">{t("contact.tag")}</div>
        <h1 className="text-3xl font-semibold">{t("contact.title")}</h1>
        <p className="text-foreground-muted">{t("contact.subtitle")}</p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Contact Form */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-xl font-semibold">{t("contact.sendMessage")}</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-1">
              <span className="text-sm">{t("contact.yourName")}</span>
              <input
                className="glass-input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("contact.namePlaceholder")}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm">{t("contact.email")}</span>
              <input
                className="glass-input"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t("contact.emailPlaceholder")}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm">{t("contact.mobile")}</span>
              <input
                className="glass-input"
                required
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder={t("contact.mobilePlaceholder")}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm">{t("contact.message")}</span>
              <textarea
                className="glass-input min-h-24"
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder={t("contact.messagePlaceholder")}
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={sending}>
              <Send size={16} />
              {sending ? t("contact.sending") : t("contact.send")}
            </button>
          </form>
        </section>

        {/* Quick Contact Options */}
        <section className="space-y-4">
          {loadingSettings ? (
            <div className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-foreground-muted/20 rounded w-1/3 mb-3"></div>
              <div className="h-3 bg-foreground-muted/20 rounded w-2/3"></div>
            </div>
          ) : (
            <>
              <div className="glass-card p-6 space-y-3 border border-[color:var(--border)]">
                <div className="flex items-center gap-2">
                  <MessageCircle size={20} className="text-accent" />
                  <h3 className="text-lg font-semibold">{t("contact.liveChat")}</h3>
                </div>
                <p className="text-sm text-foreground-muted">{t("contact.liveChatDesc")}</p>
                <div className="flex flex-wrap gap-2 text-sm">
                  {settings.whatsapp_link ? (
                    <a className="btn-primary flex items-center gap-2" href={settings.whatsapp_link} target="_blank" rel="noreferrer">
                      <Phone size={14} /> {t("contact.whatsapp")}
                    </a>
                  ) : (
                    <span className="btn-primary opacity-50 cursor-not-allowed flex items-center gap-2">
                      <Phone size={14} /> {t("contact.whatsappNotSet")}
                    </span>
                  )}
                  {settings.telegram_link ? (
                    <a className="btn-ghost flex items-center gap-2" href={settings.telegram_link} target="_blank" rel="noreferrer">
                      <Send size={14} /> {t("home.telegram")}
                    </a>
                  ) : (
                    <span className="btn-ghost opacity-50 cursor-not-allowed flex items-center gap-2">
                      <Send size={14} /> {t("contact.telegramNotSet")}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="glass-card p-6 space-y-3 border border-[color:var(--border)]">
                <div className="flex items-center gap-2">
                  <Mail size={20} className="text-accent" />
                  <h3 className="text-lg font-semibold">{t("contact.emailTitle")}</h3>
                </div>
                <p className="text-sm text-foreground-muted">{t("contact.emailDesc")}</p>
                {settings.support_email ? (
                  <a className="btn-ghost inline-flex items-center gap-2" href={`mailto:${settings.support_email}`}>
                    <Mail size={14} /> {settings.support_email}
                  </a>
                ) : (
                  <span className="text-sm text-foreground-muted italic">{t("contact.emailNotConfigured")}</span>
                )}
              </div>
              
              {settings.facebook_link && (
                <div className="glass-card p-6 space-y-3 border border-[color:var(--border)]">
                  <h3 className="text-lg font-semibold">{t("contact.followUs")}</h3>
                  <p className="text-sm text-foreground-muted">{t("contact.followUsDesc")}</p>
                  <a className="btn-ghost" href={settings.facebook_link} target="_blank" rel="noreferrer">{t("contact.facebookPage")}</a>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
