import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell, PageHeader } from "@/components/AppShell";
import { ButtonLink } from "@/components/Button";
import { getNavUser, getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDuration } from "@/lib/format";
import { MODE_LABEL } from "@/lib/labels";

export const metadata = { title: "Mes participations" };

export default async function HistoriquePage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");

  const [attempts, navUser] = await Promise.all([
    prisma.attempt.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      include: {
        contest: { select: { title: true, mode: true, questionCount: true } },
      },
    }),
    getNavUser(),
  ]);

  return (
    <AppShell user={navUser}>
      <PageHeader
        title="Mes participations"
        description="Historique de vos épreuves d'entraînement et de sélection."
        actions={
          <ButtonLink href="/accueil" variant="neutral" size="sm">
            Mon espace
          </ButtonLink>
        }
      />

      {attempts.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-4xl" aria-hidden="true">
            🧩
          </p>
          <p className="mt-3 font-semibold text-ink">
            Vous n&apos;avez encore passé aucune épreuve.
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Commencez par un entraînement pour vous familiariser avec les questions.
          </p>
          <ButtonLink href="/accueil" variant="brand" className="mt-5">
            Choisir une épreuve
          </ButtonLink>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {attempts.map((attempt) => {
            const ratio =
              attempt.contest.questionCount > 0
                ? attempt.correctCount / attempt.contest.questionCount
                : 0;

            return (
              <li key={attempt.id} className="card flex flex-col p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink">{attempt.contest.title}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {MODE_LABEL[attempt.contest.mode]} · {formatDate(attempt.startedAt)}
                    </p>
                  </div>
                  {attempt.status === "EN_COURS" ? (
                    <span className="pill bg-gold-100 text-gold-700">En cours</span>
                  ) : (
                    <span
                      className={`pill ${
                        ratio >= 0.75
                          ? "bg-ok-soft text-ok"
                          : ratio >= 0.5
                            ? "bg-gold-100 text-gold-700"
                            : "bg-surface-sunken text-ink-soft"
                      }`}
                    >
                      {attempt.correctCount}/{attempt.contest.questionCount}
                    </span>
                  )}
                </div>

                {attempt.status === "EN_COURS" ? (
                  <div className="mt-4">
                    <ButtonLink href={`/epreuve/${attempt.id}`} variant="gold" size="sm" block>
                      Reprendre l&apos;épreuve
                    </ButtonLink>
                  </div>
                ) : (
                  <>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-sunken">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-400 to-violet-500"
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                    <p className="mt-2 text-sm text-ink-soft">
                      {attempt.correctCount} bonne(s) réponse(s) ·{" "}
                      {formatDuration(attempt.totalTimeMs)}
                    </p>
                    <Link
                      href={`/resultats/${attempt.id}`}
                      className="mt-3 text-sm font-semibold text-brand-600 underline-offset-4 hover:underline"
                    >
                      Voir les résultats →
                    </Link>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
