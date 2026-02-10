"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bot, ShieldCheck, Sparkles, Zap, ChartLine, Volume2, VolumeX, MessageCircle } from "lucide-react";
import Link from "next/link";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import { PackageRecord } from "@/lib/types";
import { useLanguage } from "@/lib/language-context";

export default function Home() {
  const { t } = useLanguage();
  const [packages, setPackages] = useState<PackageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const promoVideoRef = useRef<HTMLVideoElement | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const heroHighlights = [
    { labelKey: "home.secureCheckout", icon: <ShieldCheck size={16} /> },
    { labelKey: "home.liveApprovals", icon: <Zap size={16} /> },
    { labelKey: "home.aiChat", icon: <Bot size={16} /> },
  ];

  const steps = [
    { titleKey: "home.step1.title", copyKey: "home.step1.copy" },
    { titleKey: "home.step2.title", copyKey: "home.step2.copy" },
    { titleKey: "home.step3.title", copyKey: "home.step3.copy" },
  ];

  useEffect(() => {
    async function loadPackages() {
      try {
        const res = await fetch("/api/packages");
        const json = await res.json();
        // Show both active and upcoming packages to users
        const visible = (json.packages ?? []).filter((p: PackageRecord) => p.status === "active" || p.status === "upcoming");
        setPackages(visible);
      } catch {
        setPackages([]);
      } finally {
        setLoading(false);
      }
    }
    loadPackages();
  }, []);

  useEffect(() => {
    const video = promoVideoRef.current;
    if (!video || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const playPromise = video.play();
          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
              // Autoplay with sound can be blocked until user interacts.
            });
          }
          // Auto-unmute if user has interacted with page
          if (hasUserInteracted && video.muted) {
            video.muted = false;
            setIsMuted(false);
          }
        } else {
          video.pause();
          // Mute when scrolling away
          if (!video.muted) {
            video.muted = true;
            setIsMuted(true);
          }
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [hasUserInteracted]);

  // Track any user interaction on the page
  useEffect(() => {
    const handleInteraction = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
      }
    };

    // Listen for common user interactions
    document.addEventListener("click", handleInteraction);
    document.addEventListener("keydown", handleInteraction);
    document.addEventListener("touchstart", handleInteraction);

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };
  }, [hasUserInteracted]);

  return (
    <main className="flex min-h-screen flex-col gap-20 px-6 py-14 sm:px-10 page-video-bg">
      <div className="page-video-bg__media" aria-hidden="true">
        <video
          className="page-video-bg__video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src="/video.mp4" type="video/mp4" />
        </video>
        <div className="page-video-bg__overlay" />
      </div>
      <header className="mx-auto w-full max-w-6xl">
        <div className="glass-card card-hover p-8 sm:p-10">
          <h1 className="hero-media__headline text-3xl leading-tight sm:text-4xl md:text-5xl font-semibold">
            {t("home.hero.title")}
          </h1>
          <div className="hero-media">
            <video
              ref={promoVideoRef}
              className="hero-media__video"
              src="/gpt.mp4"
              autoPlay
              muted={isMuted}
              playsInline
              preload="metadata"
              controls
              onClick={(event) => {
                const el = event.currentTarget;
                el.muted = !el.muted;
                setIsMuted(el.muted);
                el.play().catch(() => {});
              }}
            />
            <div className={`hero-media__hint flex items-center gap-2 transition-all duration-300 ${isMuted ? "opacity-100" : "opacity-0"}`}>
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              {hasUserInteracted ? "Scroll to video for sound" : "Tap anywhere, then scroll for sound"}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
            <div className="pill text-sm font-semibold text-foreground-muted">{t("home.tagline")}</div>
            <div className="flex items-center gap-2 text-sm text-foreground-muted">
              <ChartLine size={16} className="text-accent" />
              {t("home.trusted")}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-end">
            <div className="space-y-6">
              <p className="text-lg text-foreground-muted">
                {t("home.hero.subtitle")}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/purchase" className="btn-primary">
                  {t("home.startPurchase")}
                  <ArrowRight size={16} />
                </Link>
                <Link href="/policy" className="btn-ghost">
                  {t("home.viewPolicies")}
                </Link>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-foreground-muted">
                {heroHighlights.map((item) => (
                  <div key={item.labelKey} className="pill flex items-center gap-2">
                    {item.icon}
                    {t(item.labelKey)}
                  </div>
                ))}
              </div>
            </div>
            <div className="premium-card">
              <div className="premium-card-inner space-y-5">
                <div className="flex items-center gap-3">
                  <div className="premium-badge">
                    <Sparkles size={14} />
                    {t("home.livePackages")}
                  </div>
                  <div className="text-xs text-foreground-muted">{t("home.updatedRealtime")}</div>
                </div>
                <div className="space-y-3">
                  {loading ? (
                    <div className="mini-package-card">
                      <div className="text-center text-foreground-muted py-4">
                        {t("home.loadingPackages")}
                      </div>
                    </div>
                  ) : packages.length > 0 ? (
                    packages.slice(0, 2).map((pkg) => (
                      <div key={pkg.id} className="mini-package-card">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="mini-package-name flex items-center gap-2">
                              {pkg.name}
                              {pkg.status === "upcoming" && (
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Upcoming</span>
                              )}
                            </div>
                            <p className="text-xs text-foreground-muted line-clamp-2">{pkg.description}</p>
                          </div>
                          <div className="mini-package-price">৳{pkg.price}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="mini-package-card">
                      <div className="text-center text-foreground-muted py-4">
                        {t("home.noPackages")}
                      </div>
                    </div>
                  )}
                </div>
                <div className="premium-divider" />
                <div className="flex items-start gap-3 text-sm">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-accent/20 to-accent-3/10 border border-accent/30">
                    <Bot size={18} className="text-accent" />
                  </div>
                  <div className="text-foreground-muted leading-relaxed">
                    {t("home.chatbotInfo")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="tagline">{t("home.activePackages")}</p>
            <h2 className="text-2xl font-semibold">{t("home.pickService")}</h2>
            <p className="text-foreground-muted">{t("home.onlyActive")}</p>
          </div>
          <Link href="/purchase" className="btn-primary">{t("home.goToCheckout")}</Link>
        </div>
        <div className="grid-auto">
          {loading ? (
            <div className="glass-card p-8 text-center text-foreground-muted col-span-full">
              {t("home.loadingPackages")}
            </div>
          ) : packages.length > 0 ? (
            packages.map((pkg) => (
              <div key={pkg.id} className="premium-card">
                <div className="premium-card-inner space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="premium-label">
                        <Sparkles size={12} /> {t("home.package")}
                        {pkg.status === "upcoming" && (
                          <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Upcoming</span>
                        )}
                      </span>
                      <h3 className="premium-name">{pkg.name}</h3>
                    </div>
                    <div className="text-right">
                      <div className="premium-price">৳{pkg.price}</div>
                      <p className="text-xs text-foreground-muted mt-1">{t("home.oneTime")} · {pkg.currency ?? "BDT"}</p>
                    </div>
                  </div>
                  <p className="text-foreground-muted text-sm leading-relaxed">{pkg.description}</p>
                  <div className="premium-divider" />
                  <div className="flex flex-wrap gap-2">
                    {pkg.features?.map((feature) => (
                      <span key={feature} className="premium-badge">
                        <Sparkles size={12} /> {feature}
                      </span>
                    ))}
                  </div>
                  {pkg.status === "upcoming" ? (
                    <div className="text-center py-3 text-blue-400 text-sm font-medium bg-blue-500/10 rounded-lg border border-blue-500/30">
                      Coming Soon
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <Link href="/purchase" className="premium-btn-primary">{t("home.buy")}</Link>
                      <Link href="/purchase" className="premium-btn-ghost">{t("home.details")}</Link>
                    </div>
                  )}
                  {(pkg.groups?.whatsapp || pkg.groups?.telegram || pkg.groups?.facebook) && (
                    <div className="flex flex-wrap gap-3 text-xs text-foreground-muted pt-2">
                      {pkg.groups?.whatsapp && (
                        <a className="pill hover:border-green-500/50 transition-colors" href={pkg.groups.whatsapp} target="_blank" rel="noreferrer">{t("home.whatsappGroup")}</a>
                      )}
                      {pkg.groups?.telegram && (
                        <a className="pill hover:border-blue-500/50 transition-colors" href={pkg.groups.telegram} target="_blank" rel="noreferrer">{t("home.telegram")}</a>
                      )}
                      {pkg.groups?.facebook && (
                        <a className="pill hover:border-blue-600/50 transition-colors" href={pkg.groups.facebook} target="_blank" rel="noreferrer">{t("home.facebookGroup")}</a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="glass-card p-8 text-center text-foreground-muted col-span-full">
              {t("home.noPackagesAvailable")}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.titleKey} className="glass-card card-hover p-6 space-y-3 border border-[color:var(--border)]">
            <div className="pill text-xs">{t("home.step")} {index + 1}</div>
            <h3 className="text-lg font-semibold">{t(step.titleKey)}</h3>
            <p className="text-sm text-foreground-muted leading-relaxed">{t(step.copyKey)}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto w-full max-w-6xl grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-card card-hover p-6 space-y-4 border border-[color:var(--border)]">
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <MessageCircle size={16} className="text-accent" /> {t("home.chatbotKnowledge")}
          </div>
          <h3 className="text-xl font-semibold">{t("home.aiConcierge")}</h3>
          <p className="text-sm text-foreground-muted leading-relaxed">
            {t("home.chatbotDesc")}
          </p>
          <div className="grid-auto">
            {[
              t("home.offerAware"),
              t("home.paymentProof"),
              t("home.groupJoin"),
              t("home.adminControl"),
            ].map((item) => (
              <div key={item} className="pill text-sm text-foreground">{item}</div>
            ))}
          </div>
        </div>
        <div className="glass-card card-hover p-6 space-y-4 border border-[color:var(--border)]">
          <h4 className="tagline">{t("home.policyReady")}</h4>
          <h3 className="text-lg font-semibold">{t("home.keepBuyersSafe")}</h3>
          <p className="text-sm text-foreground-muted">{t("home.policyDesc")}</p>
          <Link href="/policy" className="btn-primary w-full justify-center">{t("home.viewPolicy")}</Link>
        </div>
      </section>

      <FloatingChatbot />
    </main>
  );
}
