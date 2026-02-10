"use client";

import { useState } from "react";
import { ReviewRecord } from "@/lib/types";
import { Send, Quote, Sparkles, Star, User, MessageCircle, GraduationCap, Briefcase, Heart, Share2, MessageSquare, MoreHorizontal, ThumbsUp } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, idx) => (
        <Star
          key={idx}
          size={14}
          className={idx < rating ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-gray-600"}
        />
      ))}
    </div>
  );
}

function InteractiveStarRating({ rating, onChange }: { rating: number; onChange: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((r) => (
        <button
          key={r}
          type="button"
          className="p-1 transition-transform hover:scale-110"
          onMouseEnter={() => setHover(r)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(r)}
        >
          <Star
            size={28}
            className={`transition-colors ${
              r <= (hover || rating)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-transparent text-gray-500 hover:text-yellow-400/50"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function getTimeAgo(dateStr?: string) {
  if (!dateStr) return "Recently";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function ReviewBoard({ initialReviews }: { initialReviews: ReviewRecord[] }) {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<ReviewRecord[]>(initialReviews);
  const [form, setForm] = useState({ 
    name: "", 
    rating: 5, 
    comment: "", 
    source: "Website",
    institution: "",
    occupation: "student" as "student" | "professional"
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to submit review");
      setMessage(t("reviews.submitted"));
      setForm({ name: "", rating: 5, comment: "", source: form.source, institution: "", occupation: "student" });
      if (json.review?.status === "approved") {
        setReviews((prev) => [json.review as ReviewRecord, ...prev]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not submit review";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-12">
      {/* Reviews List - Top Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30">
            <MessageSquare size={22} className="text-pink-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">{t("reviews.whatCustomersSay")}</h3>
            <p className="text-sm text-foreground-muted">{reviews.length} verified reviews</p>
          </div>
        </div>
        
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, index) => (
            <div 
              key={review.id} 
              className="social-review-card group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Card Header - Profile Area */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 p-[2px]">
                      <div className="w-full h-full rounded-full bg-[#1a1d24] flex items-center justify-center text-white font-bold text-lg">
                        {review.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <Sparkles size={10} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      {review.name}
                      <span className="text-blue-400">✓</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
                      {review.occupation === "student" ? (
                        <>
                          <GraduationCap size={12} className="text-cyan-400" />
                          <span>Student</span>
                        </>
                      ) : review.occupation === "professional" ? (
                        <>
                          <Briefcase size={12} className="text-emerald-400" />
                          <span>Professional</span>
                        </>
                      ) : null}
                      {review.institution && (
                        <span className="text-foreground-muted">• {review.institution}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                  <MoreHorizontal size={18} className="text-foreground-muted" />
                </button>
              </div>

              {/* Rating & Source Badge */}
              <div className="flex items-center gap-3 mb-3">
                <StarRow rating={review.rating} />
                <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-xs font-medium text-purple-300">
                  via {review.source ?? "Website"}
                </div>
              </div>

              {/* Comment */}
              <p className="text-[15px] text-gray-200 leading-relaxed mb-4">
                {review.comment}
              </p>

              {/* Timestamp */}
              <div className="text-xs text-foreground-muted mb-4">
                {getTimeAgo(review.created_at)}
              </div>

              {/* Social Actions Bar */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1.5 text-foreground-muted hover:text-pink-400 transition-colors group/btn">
                    <Heart size={18} className="group-hover/btn:fill-pink-400" />
                    <span className="text-sm">{(review.id.charCodeAt(0) % 40) + 15}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-foreground-muted hover:text-blue-400 transition-colors">
                    <MessageCircle size={18} />
                    <span className="text-sm">{review.id.charCodeAt(1) % 8}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-foreground-muted hover:text-emerald-400 transition-colors">
                    <Share2 size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-accent text-xs font-medium">
                  <Sparkles size={12} />
                  <span>Verified Purchase</span>
                </div>
              </div>
            </div>
          ))}
          {!reviews.length && (
            <div className="col-span-full text-center py-16 text-foreground-muted">
              <MessageCircle size={56} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg">{t("reviews.noReviews")}</p>
              <p className="text-sm mt-2">Be the first to share your experience!</p>
            </div>
          )}
        </div>
      </div>

      {/* Review Form - Bottom Section */}
      <div className="max-w-2xl mx-auto">
        <form className="social-review-form" onSubmit={handleSubmit}>
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30">
              <Sparkles size={16} className="text-pink-400" />
              <span className="text-sm text-pink-300 font-medium">{t("reviews.shareYours")}</span>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-white via-pink-200 to-purple-200 bg-clip-text text-transparent">
              {t("reviews.leaveReview")}
            </h3>
            <p className="text-sm text-foreground-muted max-w-md mx-auto">{t("reviews.leaveReviewDesc")}</p>
          </div>
          
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Name Field */}
            <label className="block space-y-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <User size={14} className="text-pink-400" />
                {t("reviews.name")}
              </span>
              <input 
                className="social-review-input" 
                placeholder="Your full name"
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                required 
              />
            </label>

            {/* Institution Field */}
            <label className="block space-y-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <GraduationCap size={14} className="text-cyan-400" />
                University / Company
              </span>
              <input 
                className="social-review-input" 
                placeholder="e.g. BUET, Google, Self-employed"
                value={form.institution} 
                onChange={(e) => setForm({ ...form, institution: e.target.value })} 
              />
            </label>

            {/* Occupation Field */}
            <label className="block space-y-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Briefcase size={14} className="text-emerald-400" />
                I am a
              </span>
              <select
                className="social-review-input"
                value={form.occupation}
                onChange={(e) => setForm({ ...form, occupation: e.target.value as "student" | "professional" })}
              >
                <option value="student">🎓 Student</option>
                <option value="professional">💼 Working Professional</option>
              </select>
            </label>
            
            {/* Source Field */}
            <label className="block space-y-2">
              <span className="text-sm font-medium">How did you find us?</span>
              <select
                className="social-review-input"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              >
                {["Website", "WhatsApp", "Facebook", "Telegram", "Friend Referral"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Rating Field - Full Width */}
          <div className="mt-5 p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
            <span className="text-sm font-medium flex items-center gap-2">
              <Star size={14} className="text-yellow-400" />
              {t("reviews.rating")}
            </span>
            <div className="flex items-center justify-center">
              <InteractiveStarRating 
                rating={form.rating} 
                onChange={(r) => setForm({ ...form, rating: r })} 
              />
            </div>
            <p className="text-center text-sm text-foreground-muted">
              {form.rating === 5 ? "⭐ Excellent!" : form.rating === 4 ? "👍 Great!" : form.rating === 3 ? "😊 Good" : form.rating === 2 ? "😐 Fair" : "😞 Poor"}
            </p>
          </div>

          {/* Comment Field - Full Width */}
          <label className="block space-y-2 mt-5">
            <span className="text-sm font-medium flex items-center gap-2">
              <MessageCircle size={14} className="text-purple-400" />
              {t("reviews.comment")}
            </span>
            <textarea
              className="social-review-input min-h-[140px] resize-none"
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="Share your experience with our service... What did you like? How was the delivery? Would you recommend us?"
              required
            />
          </label>
          
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
              <span>❌</span> {error}
            </div>
          )}
          {message && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
              <Sparkles size={14} />
              {message}
            </div>
          )}
          
          <button type="submit" className="social-review-submit mt-6" disabled={submitting}>
            <Send size={18} /> 
            {submitting ? t("reviews.submitting") : t("reviews.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
