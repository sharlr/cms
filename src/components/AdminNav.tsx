"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoLockup } from "@/components/Logo";
import { buttonClass } from "@/components/Button";
import { logoutAction } from "@/app/actions/auth";

const SECTIONS = [
  {
    title: "Pilotage",
    links: [
      { href: "/admin", label: "Tableau de bord", exact: true },
      { href: "/admin/candidats", label: "Candidats" },
    ],
  },
  {
    title: "Concours",
    links: [{ href: "/admin/concours", label: "Concours et questions" }],
  },
  {
    title: "Contenus",
    links: [
      { href: "/admin/actualites", label: "Actualités" },
      { href: "/admin/pages", label: "Pages" },
      { href: "/admin/partenaires", label: "Partenaires" },
      { href: "/admin/messages", label: "Messages" },
    ],
  },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="border-b border-hairline bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-r lg:border-b-0">
      <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-5">
        <Link href="/admin">
          <LogoLockup />
        </Link>
        <span className="pill bg-violet-500/12 text-violet-600">Admin</span>
      </div>

      {/* Barre défilante sous `lg`, colonne au-dessus. */}
      <nav className="scroll-slim overflow-x-auto px-4 pb-3 sm:px-6 lg:overflow-visible lg:px-3 lg:pb-0">
        <div className="flex gap-1 lg:flex-col lg:gap-4">
          {SECTIONS.map((section) => (
            <div key={section.title} className="flex gap-1 lg:flex-col lg:gap-0.5">
              <p className="hidden px-3 pb-1 text-[0.65rem] font-bold tracking-[0.16em] text-ink-faint uppercase lg:block">
                {section.title}
              </p>
              {section.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href, "exact" in link ? link.exact : false) ? "page" : undefined}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold whitespace-nowrap transition ${
                    isActive(link.href, "exact" in link ? link.exact : false)
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-soft hover:bg-surface-2 hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </nav>

      <div className="hidden gap-2 px-3 py-4 lg:mt-auto lg:flex lg:flex-col">
        <Link href="/accueil" className={buttonClass({ variant: "neutral", size: "sm", block: true })}>
          Espace candidat
        </Link>
        <form action={logoutAction}>
          <button type="submit" className={buttonClass({ variant: "ghost", size: "sm", block: true })}>
            Se déconnecter
          </button>
        </form>
      </div>
    </aside>
  );
}
