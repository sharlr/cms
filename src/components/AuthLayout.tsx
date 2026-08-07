import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SLOGAN, TAGLINE } from "@/lib/labels";

/**
 * Gabarit des écrans d'inscription et de connexion : formulaire à gauche,
 * panneau de marque à droite (masqué en dessous de `lg`).
 */
export function AuthLayout({
  title,
  subtitle,
  footer,
  aside,
  children,
}: {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <div className="flex flex-col px-5 py-8 sm:px-10 sm:py-12">
        <Link href="/" className="mb-8 inline-flex w-fit items-center gap-2.5">
          <Logo className="h-10 w-10" />
          <span className="font-display text-base font-extrabold text-ink">
            Concours National de Logique
          </span>
        </Link>

        <div className="mx-auto w-full max-w-lg flex-1">
          <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">{title}</h1>
          <p className="mt-2 text-ink-soft">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <div className="mt-6 text-sm text-ink-soft">{footer}</div>
        </div>
      </div>

      <aside className="hero-dark relative hidden flex-col justify-center px-12 py-16 lg:flex">
        <div className="relative z-10">
          <Logo className="h-24 w-24" tone="light" />
          <p className="mt-8 font-display text-4xl leading-tight font-extrabold text-white">
            «&nbsp;{SLOGAN}&nbsp;»
          </p>
          <p className="mt-4 max-w-sm text-lg text-white/70">{TAGLINE}</p>

          {aside ? <div className="mt-10">{aside}</div> : null}
        </div>
      </aside>
    </div>
  );
}
