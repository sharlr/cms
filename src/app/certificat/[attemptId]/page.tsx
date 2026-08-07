import { notFound, redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { PrintButton } from "@/components/PrintButton";
import { ButtonLink } from "@/components/Button";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserRank } from "@/lib/ranking";
import { formatDay, formatDuration, formatRank } from "@/lib/format";
import { SLOGAN } from "@/lib/labels";

export const metadata = { title: "Certificat de participation" };

export default async function CertificatPage(props: PageProps<"/certificat/[attemptId]">) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const { attemptId } = await props.params;
  const attempt = await prisma.attempt.findFirst({
    where: { id: attemptId, userId: user.id, status: "TERMINEE" },
    include: { contest: true },
  });
  if (!attempt) notFound();

  const ranking = await getUserRank(attempt.contestId, user.id);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <ButtonLink href={`/resultats/${attemptId}`} variant="ghost" size="sm">
          ← Retour aux résultats
        </ButtonLink>
        <PrintButton />
      </div>

      {/* Le certificat lui-même — mis en page pour l'impression A4 paysage. */}
      <article className="card-lift relative overflow-hidden bg-surface p-8 text-center sm:p-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #5b63f0 0 2px, transparent 2px 14px)",
          }}
        />

        <div className="relative">
          <div className="flex justify-center">
            <Logo className="h-20 w-20" />
          </div>

          <p className="mt-6 text-xs font-bold tracking-[0.3em] text-brand-600 uppercase">
            Concours National de Logique
          </p>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-ink sm:text-4xl">
            Certificat de participation
          </h1>

          <p className="mt-8 text-sm text-ink-soft">Décerné à</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-brand-700 sm:text-4xl">
            {user.fullName}
          </p>

          <p className="mx-auto mt-6 max-w-xl leading-relaxed text-ink-soft">
            pour sa participation à l&apos;épreuve «&nbsp;{attempt.contest.title}&nbsp;»
            de l&apos;édition {attempt.contest.edition}, organisée par l&apos;association
            dans le cadre du programme Women in STEM.
          </p>

          <dl className="mx-auto mt-8 grid max-w-lg grid-cols-3 gap-4">
            <Stat
              label="Bonnes réponses"
              value={`${attempt.correctCount}/${attempt.contest.questionCount}`}
            />
            <Stat label="Temps total" value={formatDuration(attempt.totalTimeMs)} />
            <Stat
              label="Classement"
              value={ranking ? formatRank(ranking.rank) : "—"}
            />
          </dl>

          <p className="mt-10 font-display text-lg font-bold text-ink">
            «&nbsp;{SLOGAN}&nbsp;»
          </p>

          <div className="mt-10 flex flex-wrap items-end justify-between gap-6 text-left">
            <div>
              <p className="text-xs text-ink-faint">Délivré le</p>
              <p className="font-semibold text-ink">
                {formatDay(attempt.finishedAt ?? attempt.startedAt)}
              </p>
            </div>
            <div className="text-right">
              <div className="mb-1 h-10 w-40 border-b border-hairline-strong" />
              <p className="text-xs text-ink-faint">Signature de l&apos;association</p>
            </div>
          </div>

          <p className="mt-8 text-[0.65rem] text-ink-faint">
            Référence du certificat : {attempt.id}
          </p>
        </div>
      </article>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-2 px-3 py-3">
      <dd className="font-display text-xl font-extrabold text-ink tabular-nums">{value}</dd>
      <dt className="mt-0.5 text-[0.7rem] font-semibold text-ink-faint">{label}</dt>
    </div>
  );
}
