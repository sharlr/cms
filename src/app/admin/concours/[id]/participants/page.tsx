import { notFound } from "next/navigation";
import { AdminShell, Crumbs } from "@/components/AdminShell";
import { ButtonLink } from "@/components/Button";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { getRankingWithUsers } from "@/lib/ranking";
import { formatDate, formatDuration, formatRank } from "@/lib/format";
import { CITY_LABEL, levelText } from "@/lib/labels";

export const metadata = { title: "Participations" };

export default async function ParticipantsPage(
  props: PageProps<"/admin/concours/[id]/participants">,
) {
  await requireAdmin();
  const { id } = await props.params;

  const contest = await prisma.contest.findUnique({
    where: { id },
    select: { id: true, title: true, questionCount: true },
  });
  if (!contest) notFound();

  const [ranking, inProgress, totalAttempts] = await Promise.all([
    getRankingWithUsers(id),
    prisma.attempt.findMany({
      where: { contestId: id, status: "EN_COURS" },
      include: { user: { select: { fullName: true, email: true } } },
      orderBy: { startedAt: "desc" },
    }),
    prisma.attempt.count({ where: { contestId: id } }),
  ]);

  return (
    <AdminShell
      title={`Participations — ${contest.title}`}
      breadcrumb={
        <Crumbs
          items={[
            { href: "/admin", label: "Administration" },
            { href: "/admin/concours", label: "Concours" },
            { href: `/admin/concours/${contest.id}`, label: contest.title },
            { label: "Participations" },
          ]}
        />
      }
      description={`${totalAttempts} participation(s) au total · ${ranking.length} candidat(s) classé(s) · ${inProgress.length} en cours.`}
      actions={
        ranking.length > 0 ? (
          <ButtonLink
            href={`/admin/concours/${contest.id}/participants/export`}
            variant="brand"
            size="sm"
          >
            Exporter en Excel
          </ButtonLink>
        ) : null
      }
    >
      {ranking.length === 0 ? (
        <p className="card p-10 text-center text-sm text-ink-soft">
          Aucune participation terminée pour le moment.
        </p>
      ) : (
        <div className="card overflow-hidden">
          <div className="scroll-slim overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-surface-2 text-ink">
                  <th scope="col" className="px-4 py-3 font-bold">Rang</th>
                  <th scope="col" className="px-4 py-3 font-bold">Candidat</th>
                  <th scope="col" className="px-4 py-3 font-bold">Niveau</th>
                  <th scope="col" className="px-4 py-3 font-bold">Ville</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">Score</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">Non répondues</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">Temps total</th>
                  <th scope="col" className="px-4 py-3 font-bold">Terminé le</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((row) => (
                  <tr key={row.attemptId} className="border-t border-hairline">
                    <td className="px-4 py-3 font-bold tabular-nums text-ink">
                      {formatRank(row.rank)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{row.user.fullName}</p>
                      <p className="text-xs text-ink-faint">
                        {row.user.email} · {row.user.phone}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {levelText(row.user.educationLevel, row.user.otherLevel)}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{CITY_LABEL[row.user.city]}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">
                      {row.correctCount}/{contest.questionCount}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-soft">
                      {row.unansweredCount}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-soft">
                      {formatDuration(row.totalTimeMs)}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-faint">
                      {row.finishedAt ? formatDate(row.finishedAt) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {inProgress.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-extrabold text-ink">Épreuves en cours</h2>
          <ul className="card divide-y divide-hairline">
            {inProgress.map((attempt) => (
              <li key={attempt.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{attempt.user.fullName}</p>
                  <p className="truncate text-xs text-ink-faint">{attempt.user.email}</p>
                </div>
                <span className="text-sm text-ink-soft">
                  Question {attempt.currentPosition} · démarrée{" "}
                  {formatDate(attempt.startedAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </AdminShell>
  );
}
