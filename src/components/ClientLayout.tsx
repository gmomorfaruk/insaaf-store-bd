"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { LanguageProvider, useLanguage } from "@/lib/language-context";
import { Navbar } from "@/components/Navbar";

function FooterContent() {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");
  
  // For admin pages, use static English text
  if (isAdminPage) {
    return (
      <footer className="border-t border-[color:var(--border)] bg-[rgba(255,255,255,0.02)] px-6 py-6 text-sm text-foreground-muted">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <span>Insaaf Store BD · Digital Service Hub</span>
          <div className="flex gap-4">
            <a href="/policy">Policies</a>
            <a href="/purchase">Purchase</a>
            <a href="/reviews">Reviews</a>
            <a href="/contact">Contact</a>
          </div>
        </div>
      </footer>
    );
  }
  
  // For user pages, use translations
  return <TranslatedFooter />;
}

function TranslatedFooter() {
  const { t } = useLanguage();
  
  return (
    <footer className="border-t border-[color:var(--border)] bg-[rgba(255,255,255,0.02)] px-6 py-6 text-sm text-foreground-muted">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <span>{t("footer.title")}</span>
        <div className="flex gap-4">
          <a href="/policy">{t("nav.policy")}</a>
          <a href="/purchase">{t("nav.packages")}</a>
          <a href="/reviews">{t("nav.reviews")}</a>
          <a href="/contact">{t("nav.contact")}</a>
        </div>
      </div>
    </footer>
  );
}

function LayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");
  
  return (
    <div className="flex min-h-screen flex-col">
      {!isAdminPage && <Navbar />}
      <div className="flex-1">{children}</div>
      {!isAdminPage && <FooterContent />}
    </div>
  );
}

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <LayoutContent>{children}</LayoutContent>
    </LanguageProvider>
  );
}
