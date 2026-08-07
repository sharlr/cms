import Link from "next/link";
import { AdminShell, Breakdown, StatCard } from "@/components/AdminShell";
import { ButtonLink } from "@/components/Button";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { availabilityOf } from "@/lib/availability";
import { formatDuration, formatOfficial } from "@/lib/format";
import { CITY_LABEL, GENDER_LABEL, LEVEL_LABEL, MODE_LABEL } from "@/lib/labels";
import type { City, EducationLevel, Gender } from "@/generated/prisma";

export const metadata = { title: "Tableau de bord" };

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [
    candidateCount,
    contests,
    finishedAttempts,
    byLevel,
    byGender,
    byCity,
    recent,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CANDIDATE" } }),
    prisma.contest.findMany({
      orderBy: [{ edition: "desc" }, { mode: "asc" }],
      include: { _count: { select: { questions: true, attempts: true } } },
    }),
    prisma.attempt.findMany({
      where: { status: "TERMINEE" },
      select: { correctCount: true, totalTimeMs: true, contest: { select: { questionCount: true } } },
    }),
    prisma.user.groupBy({
      by: ["educationLevel"],
      where: { role: "CANDIDATE" },
      _count: true,
    }),
    prisma.user.groupBy({ by: ["gender"], where: { role: "CANDIDATE" }, _count: true }),
    prisma.user.groupBy({ by: ["city"], where: { role: "CANDIDATE" }, _count: true }),
    prisma.user.findMany({
      where: { role: "CANDIDATE" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, fullName: true, email: true, educationLevel: true, createdAt: true },
    }),
  ]);

  // Taux de réussite : proportion de participations terminées ayant obtenu au
  // moins 50 % de bonnes réponses (seuil « Bon résultat » du cahier des charges).
  const passed = finishedAttempts.filter(
    (a) => a.contest.questionCount > 0 && a.correctCount / a.contest.questionCount >= 0.5,
  ).length;
  const successRate =
    finishedAttempts.length > 0 ? Math.round((passed / finishedAttempts.length) * 100) : 0;

  const averageTime =
    finishedAttempts.length > 0
      ? finishedAttempts.reduce((sum, a) => sum + a.totalTimeMs, 0) / finishedAttempts.length
      : 0;

  const levelCounts = new Map(byLevel.map((row) => [row.educationLevel, row._count]));
  const genderCounts = new Map(byGender.map((row) => [row.gender, row._count]));
  const cityCounts = new Map(byCity.map((row) => [row.city, row._count]));

  return (
    <AdminShell
      title="Tableau de bord"
      description="Vue d'ensemble des inscriptions, des participations et des concours programmés."
      actions={
        <ButtonLink href="/admin/concours/nouveau" variant="brand" size="sm">
          Nouveau concours
        </ButtonLink>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Candidats inscrits" value={candidateCount} />
        <StatCard
          label="Participations terminées"
          value={finishedAttempts.length}
          tone="violet"
        />
        <StatCard
          label="Taux de réussite"
          value={`${successRate} %`}
          hint="Au moins 50 % de bonnes réponses"
          tone="ok"
        />
        <StatCard
          label="Temps moyen"
          value={formatDuration(averageTime)}
          hint="Par épreuve terminée"
          tone="gold"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Breakdown
          title="Répartition par niveau scolaire"
          rows={(Object.keys(LEVEL_LABEL) as EducationLevel[]).map((level) => ({
            label: LEVEL_LABEL[level],
            count: levelCounts.get(level) ?? 0,
          }))}
        />
        <Breakdown
          title="Répartition par genre"
          rows={(Object.keys(GENDER_LABEL) as Gender[]).map((gender) => ({
            label: GENDER_LABEL[gender],
            count: genderCounts.get(gender) ?? 0,
          }))}
        />
        <Breakdown
          title="Répartition par ville"
          rows={(Object.keys(CITY_LABEL) as City[]).map((city) => ({
            label: CITY_LABEL[city],
            count: cityCounts.get(city) ?? 0,
          }))}
        />
      </div>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-ink">Concours</h2>
          <Link
            href="/admin/concours"
            className="text-sm font-semibold text-brand-600 underline-offset-4 hover:underline"
          >
            Tout gérer →
          </Link>
        </div>

        {contests.length === 0 ? (
          <p className="card p-8 text-center text-sm text-ink-soft">
            Aucun concours pour le moment.
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {contests.map((contest) => {
              const availability = availabilityOf(contest);
              return (
                <li key={contest.id} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/concours/${contest.id}`}
                        className="font-bold text-ink underline-offset-4 hover:underline"
                      >
                        {contest.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-ink-faint">
                        {MODE_LABEL[contest.mode]} · édition {contest.edition} · /
                        {contest.slug}
                      </p>
                    </div>
                    <AvailabilityPill state={availability.state} />
                  </div>

                  <p className="mt-3 text-sm text-ink-soft">
                    {contest._count.questions} question(s) ·{" "}
                    {contest._count.attempts} participation(s) ·{" "}
                    {contest.secondsPerQuestion} s par question
                  </p>

                  {contest.startsAt ? (
                    <p className="mt-1 text-xs text-ink-faint">
                      Épreuve le {formatOfficial(contest.startsAt)}
                    </p>
                  ) : null}

                  <div className="mt-4 flex gap-3 text-sm font-semibold">
                    <Link href={`/admin/concours/${contest.id}`} className="text-brand-600 underline">
                      Modifier
                    </Link>
                    <Link
                      href={`/admin/concours/${contest.id}/participants`}
                      className="text-brand-600 underline"
                    >
                      Participations
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-ink">Dernières inscriptions</h2>
          <Link
            href="/admin/candidats"
            className="text-sm font-semibold text-brand-600 underline-offset-4 hover:underline"
          >
            Tous les candidats →
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="card p-8 text-center text-sm text-ink-soft">
            Aucun candidat inscrit.
          </p>
        ) : (
          <ul className="card divide-y divide-hairline">
            {recent.map((candidate) => (
              <li key={candidate.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{candidate.fullName}</p>
                  <p className="truncate text-xs text-ink-faint">{candidate.email}</p>
                </div>
                <span className="pill bg-surface-2 text-ink-soft">
                  {LEVEL_LABEL[candidate.educationLevel]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}

function AvailabilityPill({ state }: { state: string }) {
  const map: Record<string, { label: string; className: string }> = {
    open: { label: "Ouvert", className: "bg-ok-soft text-ok" },
    scheduled: { label: "Programmé", className: "bg-gold-100 text-gold-700" },
    "not-yet-open": { label: "À venir", className: "bg-gold-100 text-gold-700" },
    closed: { label: "Clôturé", className: "bg-surface-sunken text-ink-faint" },
    inactive: { label: "Fermé", className: "bg-surface-sunken text-ink-faint" },
    empty: { label: "Sans question", className: "bg-ko-soft text-ko" },
  };
  const entry = map[state] ?? map.inactive;
  return <span className={`pill shrink-0 ${entry.className}`}>{entry.label}</span>;
}
