"use client";

import { useRef, useEffect } from "react";
import { ReviewBoard } from "@/components/ReviewBoard";
import { ReviewRecord } from "@/lib/types";
import { useLanguage } from "@/lib/language-context";
import { Sparkles, Star, MessageSquare, Users, Award } from "lucide-react";

export function ReviewsPageClient({ initialReviews }: { initialReviews: ReviewRecord[] }) {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.5; // Slow down to 50% speed
    }
  }, []);
  
  const avgRating = initialReviews.length > 0 
    ? (initialReviews.reduce((sum, r) => sum + r.rating, 0) / initialReviews.length).toFixed(1)
    : "5.0";
  
  const stats = [
    { icon: Users, value: `${initialReviews.length}+`, label: "Happy Customers" },
    { icon: Star, value: avgRating, label: "Average Rating" },
    { icon: Award, value: "100%", label: "Satisfaction" },
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
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 overflow-hidden">
        {/* Animated Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent-3/5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent-3/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
        
        <div className="relative mx-auto max-w-6xl px-6 py-16 sm:px-10">
          <div className="text-center space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 text-accent text-sm font-medium backdrop-blur-sm">
              <Sparkles size={16} className="animate-pulse" />
              <span>{t("reviews.tag")}</span>
            </div>
            
            {/* Title */}
            <h1 className="text-4xl sm:text-5xl font-bold">
              <span className="bg-gradient-to-r from-white via-accent to-accent-3 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                {t("reviews.title")}
              </span>
            </h1>
            
            <p className="text-foreground-muted text-lg max-w-2xl mx-auto">
              {t("reviews.subtitle")}
            </p>
            
            {/* Stats Row */}
            <div className="flex flex-wrap justify-center gap-4 pt-6">
              {stats.map((stat, i) => (
                <div key={i} className="review-stat-card backdrop-blur-sm">
                  <stat.icon size={20} className="text-accent" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-foreground-muted">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-16 sm:px-10">
        <ReviewBoard initialReviews={initialReviews} />
      </section>
    </main>
  );
}
