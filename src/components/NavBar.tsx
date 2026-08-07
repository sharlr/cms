"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { LogoLockup } from "@/components/Logo";
import { buttonClass } from "@/components/Button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { NavUser } from "@/components/AppShell";

const PUBLIC_LINKS = [
  { href: "/actualites", label: "Actualités" },
  { href: "/reglement", label: "Règlement" },
  { href: "/recompenses", label: "Récompenses" },
  { href: "/contact", label: "Contact" },
] as const;

const MEMBER_LINKS = [
  { href: "/accueil", label: "Mon espace" },
  { href: "/classement", label: "Classement" },
  { href: "/historique", label: "Mes participations" },
] as const;

/**
 * Barre de navigation : liens déployés à partir de `lg`, panneau repliable en
 * dessous. Le menu se referme à chaque changement de route.
 */
export function NavBar({
  user,
  logoutAction,
}: {
  user: NavUser;
  logoutAction: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();

  // Le menu se referme au changement de route. L'ajustement se fait pendant le
  // rendu plutôt que dans un effet : pas de rendu intermédiaire avec le panneau
  // encore ouvert sur la nouvelle page.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  const links = user ? [...MEMBER_LINKS, ...PUBLIC_LINKS] : PUBLIC_LINKS;

  return (
    <header className="no-print sticky top-0 z-40 border-b border-hairline bg-surface/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href={user ? "/accueil" : "/"} className="shrink-0" aria-label="Accueil">
          <LogoLockup />
        </Link>

        <nav className="ml-4 hidden flex-1 items-center gap-1 lg:flex">
          {links.map((link) => (
            <NavLink key={link.href} href={link.href} active={pathname === link.href}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />

          {user ? (
            <>
              <Link
                href="/notifications"
                className="relative hidden rounded-xl px-2.5 py-2 text-ink-soft transition hover:bg-brand-50 hover:text-ink sm:block"
                aria-label={
                  user.unreadCount > 0
                    ? `Messages (${user.unreadCount} non lus)`
                    : "Messages"
                }
              >
                <BellIcon />
                {user.unreadCount > 0 ? (
                  <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-ko px-1 text-[0.6rem] font-bold text-white">
                    {user.unreadCount > 9 ? "9+" : user.unreadCount}
                  </span>
                ) : null}
              </Link>

              {user.role === "ADMIN" ? (
                <Link
                  href="/admin"
                  className={buttonClass({ variant: "neutral", size: "sm", className: "hidden sm:inline-flex" })}
                >
                  Administration
                </Link>
              ) : null}

              <form action={logoutAction} className="hidden sm:block">
                <button type="submit" className={buttonClass({ variant: "ghost", size: "sm" })}>
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/connexion"
                className={buttonClass({ variant: "neutral", size: "sm", className: "hidden sm:inline-flex" })}
              >
                Se connecter
              </Link>
              <Link
                href="/inscription"
                className={buttonClass({ variant: "gold", size: "sm", className: "hidden sm:inline-flex" })}
              >
                S&apos;inscrire
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            className="grid size-10 place-items-center rounded-xl border border-hairline bg-surface text-ink transition hover:border-hairline-strong lg:hidden"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open ? (
        <div id={panelId} className="border-t border-hairline bg-surface lg:hidden">
          <nav className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6">
            {links.map((link) => (
              <NavLink key={link.href} href={link.href} active={pathname === link.href} block>
                {link.label}
              </NavLink>
            ))}

            <div className="mt-2 flex flex-col gap-2 border-t border-hairline pt-3">
              {user ? (
                <>
                  <Link
                    href="/notifications"
                    className={buttonClass({ variant: "neutral", size: "sm", block: true })}
                  >
                    Messages{user.unreadCount > 0 ? ` (${user.unreadCount})` : ""}
                  </Link>
                  {user.role === "ADMIN" ? (
                    <Link
                      href="/admin"
                      className={buttonClass({ variant: "violet", size: "sm", block: true })}
                    >
                      Administration
                    </Link>
                  ) : null}
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className={buttonClass({ variant: "ghost", size: "sm", block: true })}
                    >
                      Déconnexion — {user.fullName}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/connexion"
                    className={buttonClass({ variant: "neutral", size: "sm", block: true })}
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/inscription"
                    className={buttonClass({ variant: "gold", size: "sm", block: true })}
                  >
                    S&apos;inscrire au concours
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function NavLink({
  href,
  active,
  block = false,
  children,
}: {
  href: string;
  active: boolean;
  block?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        block ? "block" : "",
        "rounded-xl px-3 py-2 text-sm font-semibold transition",
        active
          ? "bg-brand-50 text-brand-700"
          : "text-ink-soft hover:bg-surface-2 hover:text-ink",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
      <path d="M13.7 20a2 2 0 0 1-3.4 0" />
    </svg>
  );
}
