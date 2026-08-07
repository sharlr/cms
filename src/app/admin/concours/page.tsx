import Link from "next/link";
import { AdminShell, Crumbs } from "@/components/AdminShell";
import { ButtonLink } from "@/components/Button";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { availabilityOf } from "@/lib/availability";
import { formatOfficial } from "@/lib/format";
import { MODE_LABEL } from "@/lib/labels";

export const metadata = { title: "Concours" };

export default async function AdminConcoursPage() {
  await requireAdmin();

  const contests = await prisma.contest.findMany({
    orderBy: [{ edition: "desc" }, { mode: "asc" }],
    include: { _count: { select: { questions: true, attempts: true } } },
  });

  return (
    <AdminShell
      title="Concours et questions"
      breadcrumb={<Crumbs items={[{ href: "/admin", label: "Administration" }, { label: "Concours" }]} />}
      description="Programmez plusieurs éditions, gérez la banque de questions et suivez les participations."
      actions={
        <ButtonLink href="/admin/concours/nouveau" variant="brand" size="sm">
          Nouveau concours
        </ButtonLink>
      }
    >
      {contests.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-semibold text-ink">Aucun concours</p>
          <p className="mt-1 text-sm text-ink-soft">
            Créez un concours pour commencer à saisir des questions.
          </p>
          <ButtonLink href="/admin/concours/nouveau" variant="brand" className="mt-5">
            Créer un concours
          </ButtonLink>
        </div>
      ) : (
        <ul className="grid gap-4 xl:grid-cols-2">
          {contests.map((contest) => {
            const availability = availabilityOf(contest);
            return (
              <li key={contest.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/concours/${contest.id}`}
                      className="text-lg font-bold text-ink underline-offset-4 hover:underline"
                    >
                      {contest.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {MODE_LABEL[contest.mode]} · édition {contest.edition} · /{contest.slug}
                    </p>
                  </div>
                  <span
                    className={`pill shrink-0 ${
                      availability.state === "open"
                        ? "bg-ok-soft text-ok"
                        : availability.state === "scheduled"
                          ? "bg-gold-100 text-gold-700"
                          : "bg-surface-sunken text-ink-faint"
                    }`}
                  >
                    {availability.state === "open"
                      ? "Ouvert"
                      : availability.state === "scheduled"
                        ? "Programmé"
                        : availability.state === "empty"
                          ? "Sans question"
                          : availability.state === "closed"
                            ? "Clôturé"
                            : "Fermé"}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Cell value={contest._count.questions} label="questions" />
                  <Cell value={contest._count.attempts} label="participations" />
                  <Cell value={`${contest.secondsPerQuestion} s`} label="par question" />
                </dl>

                {contest.startsAt ? (
                  <p className="mt-3 text-xs text-ink-faint">
                    Épreuve le {formatOfficial(contest.startsAt)}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <ButtonLink href={`/admin/concours/${contest.id}`} variant="neutral" size="sm">
                    Modifier
                  </ButtonLink>
                  <ButtonLink
                    href={`/admin/concours/${contest.id}/questions/import`}
                    variant="neutral"
                    size="sm"
                  >
                    Importer
                  </ButtonLink>
                  <ButtonLink
                    href={`/admin/concours/${contest.id}/participants`}
                    variant="ghost"
                    size="sm"
                  >
                    Participations
                  </ButtonLink>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AdminShell>
  );
}

function Cell({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-xl bg-surface-2 px-2 py-2">
      <dd className="font-display text-lg font-extrabold text-ink tabular-nums">{value}</dd>
      <dt className="text-[0.7rem] font-semibold text-ink-faint">{label}</dt>
    </div>
  );
}
