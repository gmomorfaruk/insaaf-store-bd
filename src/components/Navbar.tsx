"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { Globe, Menu, X } from "lucide-react";

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: "/", labelKey: "nav.home" },
    { href: "/purchase", labelKey: "nav.packages" },
    { href: "/reviews", labelKey: "nav.reviews" },
    { href: "/contact", labelKey: "nav.contact" },
    { href: "/policy", labelKey: "nav.policy" },
    { href: "/profile", labelKey: "nav.profile" },
  ];

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "bn" : "en");
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[rgba(5,7,12,0.9)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="text-lg sm:text-xl font-bold tracking-wide group">
          <span className="text-[#daa520] transition-all duration-300 group-hover:text-[#ffd700]">Insaaf</span>{" "}
          <span className="text-white transition-all duration-300 group-hover:text-accent">Store BD</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 text-base md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${isActive(link.href) ? "nav-link--active" : ""}`}
            >
              <span className="nav-link__text">{t(link.labelKey)}</span>
              <span className="nav-link__indicator" />
            </Link>
          ))}
        </nav>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 sm:gap-1.5 rounded-lg border border-[color:var(--border)] bg-[rgba(255,255,255,0.03)] px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm text-foreground-muted hover:bg-[rgba(255,255,255,0.06)] hover:text-foreground transition-all duration-300 hover:border-accent/50"
            title={language === "en" ? "Switch to Bangla" : "Switch to English"}
          >
            <Globe size={14} className="transition-transform duration-300 hover:rotate-180" />
            <span className="hidden xs:inline">{t("lang.toggle")}</span>
          </button>
          <Link href="/purchase" className="btn-primary text-xs sm:text-sm hidden sm:flex">
            {t("nav.buyNow")}
          </Link>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center justify-center rounded-lg border border-[color:var(--border)] bg-[rgba(255,255,255,0.03)] p-2 text-foreground-muted hover:bg-[rgba(255,255,255,0.06)] hover:text-foreground transition-all duration-300 md:hidden"
            aria-label="Toggle menu"
          >
            <span className={`transition-transform duration-300 ${mobileMenuOpen ? "rotate-180" : ""}`}>
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </span>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <nav
        className={`border-t border-[color:var(--border)] bg-[rgba(5,7,12,0.98)] px-4 overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? "max-h-96 py-4 opacity-100" : "max-h-0 py-0 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-1">
          {links.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`mobile-nav-link ${isActive(link.href) ? "mobile-nav-link--active" : ""}`}
              style={{ transitionDelay: mobileMenuOpen ? `${index * 50}ms` : "0ms" }}
            >
              {t(link.labelKey)}
            </Link>
          ))}
          <Link
            href="/purchase"
            onClick={() => setMobileMenuOpen(false)}
            className="btn-primary text-sm text-center mt-3"
            style={{ transitionDelay: mobileMenuOpen ? `${links.length * 50}ms` : "0ms" }}
          >
            {t("nav.buyNow")}
          </Link>
        </div>
      </nav>
    </header>
  );
}
