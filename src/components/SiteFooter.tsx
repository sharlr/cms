"use client";

import Link from "next/link";
import { LogoLockup } from "@/components/Logo";
import { useLanguage } from "@/i18n";

export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="no-print mt-8 border-t border-hairline bg-surface/60">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <LogoLockup />
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-ink-soft">
          <Link href="/actualites" className="hover:text-ink">
            {t("nav.news")}
          </Link>
          <Link href="/reglement" className="hover:text-ink">
            Règlement
          </Link>
          <Link href="/recompenses" className="hover:text-ink">
            Récompenses
          </Link>
          <Link href="/contact" className="hover:text-ink">
            Contact
          </Link>
        </nav>
        <p className="text-xs text-ink-faint">
          © {new Date().getFullYear()} — {t("tagline")}
        </p>
      </div>
    </footer>
  );
}
