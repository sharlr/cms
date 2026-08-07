/**
 * Marque du concours : quatre pièces de puzzle imbriquées, la dernière
 * remplacée par un point d'interrogation. Reprise de l'identité de la maquette
 * (puzzle + « ? ») mais redessinée en dégradés doux, sans contour noir.
 *
 * `tone="light"` inverse le point d'interrogation pour les fonds sombres.
 */
export function Logo({
  className = "h-12 w-12",
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const uid = tone === "light" ? "l" : "d";

  return (
    <svg
      viewBox="0 0 128 128"
      className={className}
      role="img"
      aria-label="Concours National de Logique"
    >
      <defs>
        <linearGradient id={`${uid}-a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7f8cfa" />
          <stop offset="100%" stopColor="#4644dc" />
        </linearGradient>
        <linearGradient id={`${uid}-b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id={`${uid}-c`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38e0f5" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id={`${uid}-d`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd45f" />
          <stop offset="100%" stopColor="#eaa505" />
        </linearGradient>
      </defs>

      {/* pièce haut-gauche — tenon vers la droite */}
      <path
        fill={`url(#${uid}-a)`}
        d="M20 26a6 6 0 0 1 6-6h30v9a8 8 0 1 0 0 16v9H26a6 6 0 0 1-6-6z"
      />
      {/* pièce bas-gauche — mortaise vers la droite */}
      <path
        fill={`url(#${uid}-b)`}
        d="M20 70a6 6 0 0 1 6-6h30v9a8 8 0 1 1 0 16v9H26a6 6 0 0 1-6-6z"
      />
      {/* pièce bas-droite — mortaise vers le haut */}
      <path
        fill={`url(#${uid}-c)`}
        d="M64 64h9a8 8 0 1 1 16 0h9a6 6 0 0 1 6 6v32a6 6 0 0 1-6 6H70a6 6 0 0 1-6-6z"
      />

      {/* point d'interrogation, à la place de la quatrième pièce */}
      <g fill={`url(#${uid}-d)`}>
        <path d="M83 18c-11.6 0-20 7-20.6 17.4a4.6 4.6 0 0 0 4.6 4.9h2.2a4.5 4.5 0 0 0 4.5-3.9c.6-4 3.9-6.6 8.6-6.6 4.9 0 8.2 2.6 8.2 6.2 0 3.2-1.6 5.1-6.2 7.9-5.2 3.1-7.4 6.4-7.1 11.6l.1 1.5a4.5 4.5 0 0 0 4.5 4.2h1.8a4.5 4.5 0 0 0 4.5-4.7c-.1-2.6 1-4.2 4.9-6.5 6.2-3.7 9.2-7.7 9.2-14.2C102.2 25.6 94.4 18 83 18z" />
        <circle cx="82" cy="76" r="7.5" />
      </g>
    </svg>
  );
}

/** Version compacte pour les en-têtes : marque + nom du concours. */
export function LogoLockup({
  tone = "dark",
  className = "",
}: {
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <Logo className="h-9 w-9 shrink-0" tone={tone} />
      <span className="flex flex-col leading-none">
        <span
          className={`font-display text-[0.95rem] font-extrabold tracking-tight ${
            tone === "light" ? "text-white" : "text-ink"
          }`}
        >
          Concours National
        </span>
        <span
          className={`text-[0.7rem] font-semibold tracking-[0.18em] uppercase ${
            tone === "light" ? "text-white/60" : "text-ink-faint"
          }`}
        >
          de Logique
        </span>
      </span>
    </span>
  );
}
