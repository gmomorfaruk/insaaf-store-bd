"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, X } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export function FloatingChatbot() {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Update greeting when language changes
  useEffect(() => {
    setMessages([{ role: "bot", text: t("chatbot.greeting") }]);
  }, [language, t]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    if (!input.trim()) return;
    const userMsg = { role: "user" as const, text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text, language }),
      });
      const json = await res.json();
      const reply = json.reply ?? t("chatbot.default");
      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: t("chatbot.error") }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
      {open ? (
        <div className="glass-card w-[calc(100vw-2rem)] max-w-80 p-3 sm:p-4 shadow-2xl border border-[color:var(--border)]">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Bot size={16} /> {t("chatbot.assistant")}
            </div>
            <button className="btn-ghost text-xs" onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </div>
          <div className="divider" />
          <div className="flex max-h-48 sm:max-h-64 flex-col gap-2 overflow-y-auto py-2 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={`rounded-lg px-3 py-2 ${m.role === "bot" ? "bg-[rgba(255,255,255,0.03)]" : "bg-accent/20"}`}>
                {m.text}
              </div>
            ))}
            {loading && <div className="text-xs text-foreground-muted">{t("chatbot.thinking")}</div>}
            <div ref={endRef} />
          </div>
          <div className="flex gap-2 pt-2">
            <input
              className="glass-input text-sm"
              placeholder={t("chatbot.placeholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button className="btn-primary" onClick={send} disabled={loading}>
              <Send size={16} />
            </button>
          </div>
          <p className="pt-2 text-[10px] sm:text-[11px] text-foreground-muted">{t("chatbot.tip")}</p>
        </div>
      ) : (
        <button className="btn-primary flex items-center gap-2" onClick={() => setOpen(true)}>
          <Bot size={16} /> {t("chatbot.chat")}
        </button>
      )}
    </div>
  );
}
