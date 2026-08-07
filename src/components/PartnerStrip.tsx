import Image from "next/image";
import type { Partner } from "@/generated/prisma";

/**
 * Bandeau des partenaires institutionnels, académiques et financiers, en pied
 * de page d'accueil. Sans logo téléversé, le nom sert de pastille.
 */
export function PartnerStrip({
  partners,
  className = "",
}: {
  partners: Partner[];
  className?: string;
}) {
  if (partners.length === 0) return null;

  return (
    <section className={className}>
      <h2 className="text-center text-xs font-bold tracking-[0.2em] text-ink-faint uppercase">
        Avec le soutien de nos partenaires
      </h2>

      <ul className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        {partners.map((partner) => {
          const content = partner.logoUrl ? (
            <Image
              src={partner.logoUrl}
              alt={partner.name}
              width={160}
              height={64}
              className="h-10 w-auto object-contain sm:h-12"
            />
          ) : (
            <span className="text-center text-sm font-bold text-ink-soft">
              {partner.name}
            </span>
          );

          return (
            <li key={partner.id}>
              {partner.websiteUrl ? (
                <a
                  href={partner.websiteUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex h-20 w-40 items-center justify-center rounded-2xl border border-hairline bg-surface px-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
                >
                  {content}
                </a>
              ) : (
                <div className="flex h-20 w-40 items-center justify-center rounded-2xl border border-hairline bg-surface px-4">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
