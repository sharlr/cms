import Link from "next/link";
import { LogoLockup } from "@/components/Logo";
import { AdminNav } from "@/components/AdminNav";

/**
 * Cadre de l'administration : navigation latérale sur grand écran, barre
 * horizontale défilante en dessous de `lg`.
 */
export function AdminShell({
  title,
  breadcrumb,
  description,
  actions,
  children,
}: {
  title: string;
  breadcrumb?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <AdminNav />

      <div className="min-w-0">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <header className="mb-8">
            {breadcrumb ? (
              <nav className="mb-1.5 text-xs font-semibold text-ink-faint">{breadcrumb}</nav>
            ) : null}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{title}</h1>
                {description ? (
                  <div className="mt-1.5 max-w-2xl text-[0.95rem] text-ink-soft">
                    {description}
                  </div>
                ) : null}
              </div>
              {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
            </div>
          </header>

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}

/** Fil d'Ariane compact réutilisé par les sous-pages. */
export function Crumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <>
      {items.map((item, index) => (
        <span key={index}>
          {index > 0 ? <span className="mx-1.5 text-hairline-strong">›</span> : null}
          {item.href ? (
            <Link href={item.href} className="hover:text-ink hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="text-ink-soft">{item.label}</span>
          )}
        </span>
      ))}
    </>
  );
}

/** Carte de statistique du tableau de bord. */
export function StatCard({
  label,
  value,
  hint,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "brand" | "gold" | "ok" | "violet";
}) {
  const toneClass = {
    brand: "text-brand-600",
    gold: "text-gold-600",
    ok: "text-ok",
    violet: "text-violet-600",
  }[tone];

  return (
    <div className="card p-5">
      <p className="text-xs font-bold tracking-[0.14em] text-ink-faint uppercase">
        {label}
      </p>
      <p className={`stat mt-2 ${toneClass}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-faint">{hint}</p> : null}
    </div>
  );
}

/**
 * Répartition en barres horizontales — niveau scolaire, genre, ville.
 * Pas de dépendance graphique : les largeurs sont calculées côté serveur.
 */
export function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; count: number }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <section className="card p-5">
      <h2 className="text-sm font-bold tracking-[0.14em] text-ink-faint uppercase">
        {title}
      </h2>

      {total === 0 ? (
        <p className="mt-4 text-sm text-ink-faint">Aucune donnée.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium text-ink">{row.label}</span>
                <span className="tabular-nums text-ink-soft">
                  {row.count}
                  <span className="ml-1 text-xs text-ink-faint">
                    ({Math.round((row.count / total) * 100)} %)
                  </span>
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-400 to-violet-500"
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export { LogoLockup };
