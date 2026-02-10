"use client";

import { useRef, useEffect } from "react";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import { useLanguage } from "@/lib/language-context";
import { Shield, Lock, RefreshCw, Cpu, Zap, CheckCircle, Sparkles } from "lucide-react";

export default function PolicyPage() {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.5; // Slow down to 50% speed
    }
  }, []);

  const policyCards = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: t("policy.terms"),
      items: [
        t("policy.terms.1"),
        t("policy.terms.2"),
        t("policy.terms.3"),
        t("policy.terms.4"),
      ],
      gradient: "from-violet-500 to-purple-600",
      glow: "violet",
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: t("policy.privacy"),
      items: [
        t("policy.privacy.1"),
        t("policy.privacy.2"),
        t("policy.privacy.3"),
        t("policy.privacy.4"),
      ],
      gradient: "from-cyan-500 to-blue-600",
      glow: "cyan",
    },
    {
      icon: <RefreshCw className="w-8 h-8" />,
      title: t("policy.refund"),
      items: [
        t("policy.refund.1"),
        t("policy.refund.2"),
        t("policy.refund.3"),
      ],
      gradient: "from-emerald-500 to-green-600",
      glow: "emerald",
    },
    {
      icon: <Cpu className="w-8 h-8" />,
      title: t("policy.disclaimer"),
      items: [
        t("policy.disclaimer.1"),
        t("policy.disclaimer.2"),
        t("policy.disclaimer.3"),
      ],
      gradient: "from-orange-500 to-red-600",
      glow: "orange",
    },
  ];

  return (
    <main className="relative min-h-screen">
      {/* Video Background */}
      <div className="fixed inset-0 z-0">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src="/policy.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-violet-900/20 via-transparent to-cyan-900/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-16 sm:px-10">
        {/* Hero Header */}
        <header className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border border-violet-500/30">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-cyan-300">{t("policy.tag")}</span>
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          
          <h1 className="policy-hero-title">
            {t("policy.title")}
          </h1>
          
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {t("policy.subtitle")}
          </p>

          {/* AI Stats Bar */}
          <div className="flex flex-wrap justify-center gap-6 pt-4">
            <div className="ai-stat-pill">
              <div className="ai-stat-value">100%</div>
              <div className="ai-stat-label">Secure</div>
            </div>
            <div className="ai-stat-pill">
              <div className="ai-stat-value">24/7</div>
              <div className="ai-stat-label">Support</div>
            </div>
            <div className="ai-stat-pill">
              <div className="ai-stat-value">10K+</div>
              <div className="ai-stat-label">Trusted</div>
            </div>
            <div className="ai-stat-pill">
              <div className="ai-stat-value">100%</div>
              <div className="ai-stat-label">Refund</div>
            </div>
          </div>
        </header>

        {/* Policy Cards Grid */}
        <div className="grid gap-8 md:grid-cols-2">
          {policyCards.map((card, index) => (
            <div key={index} className="policy-card group">
              <div className="policy-card-inner">
                {/* Card Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className={`policy-icon-wrap bg-gradient-to-br ${card.gradient}`}>
                    {card.icon}
                  </div>
                  <div>
                    <h2 className="policy-card-title">{card.title}</h2>
                    <div className="h-1 w-16 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 mt-2" />
                  </div>
                </div>

                {/* Card Items */}
                <ul className="space-y-4">
                  {card.items.map((item, idx) => (
                    <li key={idx} className="policy-item">
                      <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
          ))}
        </div>

        {/* AI Trust Badge */}
        <div className="mt-16 text-center">
          <div className="ai-trust-badge">
            <div className="ai-trust-badge-inner">
              <Cpu className="w-6 h-6 text-cyan-400" />
              <div className="text-left">
                <div className="text-sm font-bold text-white">AI-Powered Trust</div>
                <div className="text-xs text-gray-400">Verified & Protected by Advanced AI Systems</div>
              </div>
              <div className="ai-pulse" />
            </div>
          </div>
        </div>
      </div>

      <FloatingChatbot />
    </main>
  );
}
