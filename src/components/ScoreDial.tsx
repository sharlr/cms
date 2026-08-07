/**
 * Cadran du score : anneau de progression en SVG, note au centre. Rendu côté
 * serveur, sans script — l'anneau est un simple `stroke-dasharray`.
 */
export function ScoreDial({
  correct,
  total,
  size = 168,
}: {
  correct: number;
  total: number;
  size?: number;
}) {
  const ratio = total > 0 ? correct / total : 0;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const color = ratio >= 0.75 ? "#0e9f6e" : ratio >= 0.5 ? "#eaa505" : "#5b63f0";

  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${correct} bonnes réponses sur ${total}`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-surface-sunken"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
        />
      </svg>

      <div className="absolute inset-0 grid place-content-center text-center">
        <span className="font-display text-4xl leading-none font-extrabold text-ink tabular-nums">
          {correct}
          <span className="text-2xl text-ink-faint">/{total}</span>
        </span>
        <span className="mt-1 text-xs font-bold text-ink-faint">
          {Math.round(ratio * 100)} % de réussite
        </span>
      </div>
    </div>
  );
}
