"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/**
 * Compte à rebours jusqu'à l'heure officielle de l'épreuve. À échéance, la page
 * est rafraîchie : le serveur rend alors le bouton actif, sans que le candidat
 * ait à recharger lui-même.
 *
 * Le décompte ne démarre qu'après montage. Le rendu serveur affiche des tirets :
 * une valeur calculée pendant le rendu serveur serait déjà périmée à
 * l'hydratation, et React signalerait une divergence à chaque chargement.
 */
export function Countdown({ target, tone = "dark" }: { target: string; tone?: "dark" | "light" }) {
  const router = useRouter();
  const targetMs = new Date(target).getTime();
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      const next = targetMs - Date.now();
      setRemaining(next);
      return next;
    };

    if (update() <= 0) {
      router.refresh();
      return;
    }

    const id = setInterval(() => {
      if (update() <= 0) {
        clearInterval(id);
        router.refresh();
      }
    }, 1000);

    return () => clearInterval(id);
  }, [targetMs, router]);

  const { days, hours, minutes, seconds } = parts(remaining ?? 0);
  const cellClass =
    tone === "light"
      ? "bg-white/10 text-white ring-1 ring-white/20"
      : "bg-surface-2 text-ink ring-1 ring-hairline";
  const labelClass = tone === "light" ? "text-white/55" : "text-ink-faint";

  const cells = [
    { value: days, label: "jours" },
    { value: hours, label: "heures" },
    { value: minutes, label: "min" },
    { value: seconds, label: "sec" },
  ];

  return (
    <div className="flex gap-2" role="timer" aria-live="off">
      {cells.map((cell) => (
        <div key={cell.label} className={`flex-1 rounded-xl px-2 py-2.5 text-center ${cellClass}`}>
          <span className="block font-display text-xl font-extrabold tabular-nums sm:text-2xl">
            {remaining === null ? "––" : String(cell.value).padStart(2, "0")}
          </span>
          <span className={`text-[0.65rem] font-semibold tracking-wide uppercase ${labelClass}`}>
            {cell.label}
          </span>
        </div>
      ))}
    </div>
  );
}
