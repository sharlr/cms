import Link from "next/link";
import { LogoLockup } from "@/components/Logo";
import { NavBar } from "@/components/NavBar";
import { SiteFooter } from "@/components/SiteFooter";
import { logoutAction } from "@/app/actions/auth";

export type NavUser = {
  fullName: string;
  role: "CANDIDATE" | "ADMIN";
  unreadCount: number;
} | null;

/**
 * Cadre applicatif : en-tête collant avec navigation, contenu fluide, pied de
 * page. Pleine largeur du téléphone au grand écran — aucune largeur figée.
 */
export function AppShell({
  user,
  children,
  width = "default",
}: {
  user: NavUser;
  children: React.ReactNode;
  width?: "default" | "wide" | "narrow";
}) {
  const maxWidth =
    width === "wide" ? "max-w-7xl" : width === "narrow" ? "max-w-2xl" : "max-w-5xl";

  return (
    <div className="flex min-h-dvh flex-col">
      <NavBar user={user} logoutAction={logoutAction} />

      <main className={`mx-auto w-full flex-1 ${maxWidth} px-4 py-6 sm:px-6 sm:py-8 lg:px-8`}>
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}

/** Cadre sans en-tête ni pied de page — épreuve en cours, certificat. */
export function FocusShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
        {children}
      </main>
    </div>
  );
}


/** En-tête de section : sur-titre, titre et actions alignées à droite. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-xs font-bold tracking-[0.18em] text-brand-600 uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{title}</h1>
        {description ? (
          <div className="mt-1.5 max-w-2xl text-[0.95rem] text-ink-soft">{description}</div>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
