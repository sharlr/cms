import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ButtonLink } from "@/components/Button";
import { ScoreDial } from "@/components/ScoreDial";
import { getNavUser, getSessionUserId } from "@/lib/auth";
import { getAttemptResults } from "@/lib/contest";
import { formatDuration, formatRank } from "@/lib/format";

export const metadata = { title: "Résultats" };

const TONE_STYLE = {
  excellent: "border-ok/30 bg-ok-soft",
  good: "border-gold-300/50 bg-gold-100/50",
  "keep-going": "border-brand-200 bg-brand-50",
} as const;

export default async function ResultatsPage(props: PageProps<"/resultats/[attemptId]">) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");

  const { attemptId } = await props.params;
  const results = await getAttemptResults(attemptId, userId);
  if (!results) notFound();
  if (results.status === "EN_COURS") redirect(`/epreuve/${attemptId}`);

  const navUser = await getNavUser();

  const stats = [
    { label: "Bonnes réponses", value: String(results.correctCount), tone: "text-ok" },
    { label: "Fausses réponses", value: String(results.wrongCount), tone: "text-ko" },
    { label: "Non répondues", value: String(results.unansweredCount), tone: "text-ink-faint" },
    {
      label: "Temps total",
      value: formatDuration(results.totalTimeMs),
      tone: "text-brand-600",
    },
  ];

  return (
    <AppShell user={navUser} width="narrow">
      <div className="rise text-center">
        <p className="text-xs font-bold tracking-[0.18em] text-brand-600 uppercase">
          Résultats
        </p>
        <h1 className="mt-1.5 text-3xl font-extrabold text-ink sm:text-4xl">
          {results.contest.title}
        </h1>
      </div>

      <section
        className={`card mt-7 border p-7 text-center sm:p-9 ${TONE_STYLE[results.verdict.tone]}`}
      >
        <ScoreDial correct={results.correctCount} total={results.total} />

        <h2 className="mt-6 text-2xl font-extrabold text-ink">{results.verdict.title}</h2>
        <p className="mx-auto mt-2 max-w-md text-[0.975rem] leading-relaxed text-ink-soft">
          {results.verdict.message}
        </p>

        {results.ranking ? (
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-bold text-ink shadow-[var(--shadow-soft)]">
            <span aria-hidden="true">🏅</span>
            {formatRank(results.ranking.rank)} sur {results.ranking.total} participants
          </p>
        ) : null}
      </section>

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card px-4 py-4 text-center">
            <dd className={`font-display text-2xl font-extrabold tabular-nums ${stat.tone}`}>
              {stat.value}
            </dd>
            <dt className="mt-1 text-xs font-semibold text-ink-faint">{stat.label}</dt>
          </div>
        ))}
      </dl>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <ButtonLink href={`/resultats/${attemptId}/recapitulatif`} variant="brand" block>
          Tableau récapitulatif
        </ButtonLink>
        {results.contest.mode === "SELECTION" ? (
          <ButtonLink href={`/certificat/${attemptId}`} variant="gold" block>
            Mon certificat
          </ButtonLink>
        ) : (
          <ButtonLink href={`/consignes/${results.contest.slug}`} variant="neutral" block>
            Refaire l&apos;entraînement
          </ButtonLink>
        )}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <ButtonLink href="/classement" variant="neutral" block>
          Voir le classement
        </ButtonLink>
        <ButtonLink href="/accueil" variant="ghost" block>
          Retour à mon espace
        </ButtonLink>
      </div>
    </AppShell>
  );
}
