import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { AppShell } from "@/components/AppShell";
import { ButtonLink } from "@/components/Button";
import { NewsCard } from "@/components/NewsCard";
import { PartnerStrip } from "@/components/PartnerStrip";
import { getSessionUserId } from "@/lib/auth";
import { getPartners, getPublishedNews } from "@/lib/content";
import { prisma } from "@/lib/prisma";
import { availabilityOf } from "@/lib/availability";
import { formatOfficial } from "@/lib/format";
import { PITCH, SLOGAN, TAGLINE } from "@/lib/labels";

export default async function AccueilPublicPage() {
  if (await getSessionUserId()) redirect("/accueil");

  const [news, partners, selection, candidateCount] = await Promise.all([
    getPublishedNews(3),
    getPartners(),
    prisma.contest.findFirst({
      where: { mode: "SELECTION", isActive: true },
      orderBy: { edition: "desc" },
    }),
    prisma.user.count({ where: { role: "CANDIDATE" } }),
  ]);

  const availability = selection ? availabilityOf(selection) : null;

  return (
    <AppShell user={null} width="wide">
      {/* ------------------------------------------------------------ héros */}
      <section className="hero-dark rise -mx-4 rounded-none px-6 py-12 sm:-mx-6 sm:rounded-[2rem] sm:px-10 sm:py-16 lg:px-16 lg:py-20">
        <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <span className="pill items-start bg-white/12 text-white/85 ring-1 ring-white/20">
              <span aria-hidden="true" className="mt-px">
                ✦
              </span>
              <span>
                Women in STEM  Changed By Moon· avec le parrainage de la Présidence de la République
              </span>
            </span>

            <h1 className="mt-5 text-4xl leading-[1.05] font-extrabold sm:text-5xl lg:text-6xl">
              Concours National
              <span className="block bg-gradient-to-r from-gold-300 via-gold-200 to-white bg-clip-text text-transparent">
                de Logique
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-lg text-white/75 sm:text-xl">
              {TAGLINE}
            </p>
            <p className="mt-2 max-w-xl text-[0.975rem] text-white/60">{PITCH}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/inscription" variant="gold" size="lg">
                S&apos;inscrire au concours
              </ButtonLink>
              <ButtonLink
                href="/connexion"
                size="lg"
                className="!bg-none !bg-white/10 !text-white ring-1 ring-white/25 backdrop-blur"
                style={{ ["--edge" as string]: "rgb(255 255 255 / 0.18)" }}
              >
                Se connecter
              </ButtonLink>
            </div>

            <dl className="mt-9 flex flex-wrap gap-x-10 gap-y-4">
              <HeroStat value={`${candidateCount}`} label="candidats inscrits" />
              <HeroStat value="20" label="questions par épreuve" />
              <HeroStat value="30 s" label="par question" />
            </dl>
          </div>

          <div className="relative hidden justify-self-center lg:block">
            <div className="absolute inset-0 -z-10 rounded-full bg-white/10 blur-3xl" />
            <Logo className="h-72 w-72 drop-shadow-2xl" tone="light" />
            <p className="mt-6 text-center font-display text-2xl font-bold text-white/90">
              «&nbsp;{SLOGAN}&nbsp;»
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------- prochaine échéance */}
      {selection && availability ? (
        <section className="card-lift mt-8 flex flex-wrap items-center justify-between gap-5 p-6 sm:p-7">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.18em] text-brand-600 uppercase">
              Prochaine échéance
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-ink">{selection.title}</h2>
            <p className="mt-1 text-[0.95rem] text-ink-soft">
              {availability.state === "scheduled"
                ? `Épreuve officielle le ${formatOfficial(availability.startsAt)}.`
                : availability.state === "open"
                  ? "L'épreuve est ouverte : connectez-vous pour la passer."
                  : availability.state === "closed"
                    ? "L'épreuve est terminée. Les résultats seront publiés dans les actualités."
                    : "Les dates seront annoncées prochainement."}
            </p>
          </div>
          <ButtonLink href="/inscription" variant="brand">
            Réserver ma place
          </ButtonLink>
        </section>
      ) : null}

      {/* ---------------------------------------------------- comment ça marche */}
      <section className="mt-12">
        <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">
          Comment participer&nbsp;?
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          <Step
            index={1}
            title="Créez votre compte"
            text="Une inscription unique par candidat, avec vos informations scolaires."
          />
          <Step
            index={2}
            title="Entraînez-vous"
            text="Des séries de 20 questions chronométrées, disponibles à tout moment."
          />
          <Step
            index={3}
            title="Passez la sélection"
            text="Le jour J, l'épreuve s'ouvre automatiquement à l'heure officielle."
          />
        </ol>
      </section>

      {/* ------------------------------------------------------- récompenses */}
      <section className="card-lift mt-12 overflow-hidden">
        <div className="grid gap-8 p-7 sm:p-9 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <span className="pill bg-gold-100 text-gold-700">Récompenses</span>
            <h2 className="mt-3 text-2xl font-extrabold text-ink sm:text-3xl">
              Tous les sélectionnés sont récompensés
            </h2>
            <p className="mt-3 text-[0.975rem] leading-relaxed text-ink-soft">
              Les prix et cadeaux sont définis chaque année avec les partenaires du
              concours. Tous les participants sélectionnés reçoivent une récompense
              ainsi qu&apos;un certificat de participation signé par l&apos;association.
            </p>
            <ButtonLink href="/recompenses" variant="gold" className="mt-6">
              Découvrir les récompenses
            </ButtonLink>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <Award emoji="🏆" label="Prix" />
            <Award emoji="🎁" label="Cadeaux" />
            <Award emoji="📜" label="Certificat" />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- actualités */}
      {news.length > 0 ? (
        <section className="mt-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">Actualités</h2>
            <Link
              href="/actualites"
              className="text-sm font-semibold text-brand-600 underline-offset-4 hover:underline"
            >
              Toutes les actualités →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {news.map((item) => (
              <NewsCard key={item.id} news={item} />
            ))}
          </div>
        </section>
      ) : null}

      <PartnerStrip partners={partners} className="mt-14" />
    </AppShell>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block font-display text-3xl font-extrabold text-white">
          {value}
        </span>
        <span className="text-sm text-white/55">{label}</span>
      </dd>
    </div>
  );
}

function Step({ index, title, text }: { index: number; title: string; text: string }) {
  return (
    <li className="card relative p-6">
      <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 font-display text-lg font-extrabold text-brand-700">
        {index}
      </span>
      <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1.5 text-[0.925rem] leading-relaxed text-ink-soft">{text}</p>
    </li>
  );
}

function Award({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="grid aspect-square place-items-center rounded-2xl border border-hairline bg-surface-2 text-center">
      <div>
        <span className="text-3xl sm:text-4xl" aria-hidden="true">
          {emoji}
        </span>
        <p className="mt-1.5 text-xs font-bold text-ink-soft">{label}</p>
      </div>
    </div>
  );
}
