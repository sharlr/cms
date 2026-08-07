import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { ButtonLink } from "@/components/Button";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { CITIES, CITY_LABEL, GENDER_LABEL, LEVELS, levelText } from "@/lib/labels";
import type { City, EducationLevel, Prisma } from "@/generated/prisma";
import { CandidateFilters } from "./CandidateFilters";

export const metadata = { title: "Candidats" };

const PAGE_SIZE = 25;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CandidatsPage(props: PageProps<"/admin/candidats">) {
  await requireAdmin();
  const params = await props.searchParams;

  const search = (firstParam(params.q) ?? "").trim();
  const level = firstParam(params.niveau);
  const city = firstParam(params.ville);
  const page = Math.max(1, Number(firstParam(params.page) ?? 1) || 1);

  const where: Prisma.UserWhereInput = { role: "CANDIDATE" };

  // SQLite ne gère pas `mode: "insensitive"` ; les colonnes sont comparées
  // telles quelles, la recherche reste donc sensible à la casse sur le nom.
  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ];
  }
  if (level && LEVELS.includes(level as EducationLevel)) {
    where.educationLevel = level as EducationLevel;
  }
  if (city && CITIES.includes(city as City)) {
    where.city = city as City;
  }

  const [total, candidates] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        _count: { select: { attempts: true } },
        attempts: {
          where: { status: "TERMINEE" },
          orderBy: [{ correctCount: "desc" }, { totalTimeMs: "asc" }],
          take: 1,
          select: { id: true, correctCount: true, contest: { select: { questionCount: true } } },
        },
      },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const queryString = (overrides: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams();
    if (search) next.set("q", search);
    if (level) next.set("niveau", level);
    if (city) next.set("ville", city);
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    const text = next.toString();
    return text ? `?${text}` : "";
  };

  return (
    <AdminShell
      title="Candidats inscrits"
      description={`${total} candidat(s) correspondant aux critères.`}
      actions={
        <ButtonLink href="/admin/candidats/export" variant="neutral" size="sm">
          Exporter en Excel
        </ButtonLink>
      }
    >
      <CandidateFilters search={search} level={level ?? ""} city={city ?? ""} />

      {candidates.length === 0 ? (
        <p className="card mt-6 p-10 text-center text-sm text-ink-soft">
          Aucun candidat ne correspond à ces critères.
        </p>
      ) : (
        <div className="card mt-6 overflow-hidden">
          <div className="scroll-slim overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-surface-2 text-ink">
                  <th scope="col" className="px-4 py-3 font-bold">Candidat</th>
                  <th scope="col" className="px-4 py-3 font-bold">Niveau</th>
                  <th scope="col" className="px-4 py-3 font-bold">Ville</th>
                  <th scope="col" className="px-4 py-3 font-bold">Sexe</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">Participations</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">Meilleur score</th>
                  <th scope="col" className="px-4 py-3 font-bold">Inscrit le</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => {
                  const best = candidate.attempts[0];
                  return (
                    <tr key={candidate.id} className="border-t border-hairline">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink">{candidate.fullName}</p>
                        <p className="text-xs text-ink-faint">
                          {candidate.email} · {candidate.phone}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {levelText(candidate.educationLevel, candidate.otherLevel)}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {CITY_LABEL[candidate.city]}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {GENDER_LABEL[candidate.gender]}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-ink-soft">
                        {candidate._count.attempts}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {best ? (
                          <Link
                            href={`/admin/participations/${best.id}`}
                            className="font-semibold text-brand-600 underline"
                          >
                            {best.correctCount}/{best.contest.questionCount}
                          </Link>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-faint">
                        {formatDate(candidate.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pageCount > 1 ? (
        <nav className="mt-5 flex items-center justify-between gap-3">
          <ButtonLink
            href={`/admin/candidats${queryString({ page: page - 1 })}`}
            variant="neutral"
            size="sm"
            className={page <= 1 ? "pointer-events-none opacity-40" : ""}
          >
            ← Précédent
          </ButtonLink>
          <span className="text-sm text-ink-soft">
            Page {page} sur {pageCount}
          </span>
          <ButtonLink
            href={`/admin/candidats${queryString({ page: page + 1 })}`}
            variant="neutral"
            size="sm"
            className={page >= pageCount ? "pointer-events-none opacity-40" : ""}
          >
            Suivant →
          </ButtonLink>
        </nav>
      ) : null}
    </AdminShell>
  );
}
