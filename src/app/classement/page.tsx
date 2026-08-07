import { redirect } from "next/navigation";
import { AppShell, PageHeader } from "@/components/AppShell";
import { getCurrentUser, getNavUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRankingWithUsers } from "@/lib/ranking";
import { formatDuration, formatRank } from "@/lib/format";
import { levelText, MODE_LABEL } from "@/lib/labels";

export const metadata = { title: "Classement" };

/** Anonymise un nom pour l'affichage public : « Awa Hassan » → « Awa H. ». */
function shortName(fullName: string) {
  const [first, ...rest] = fullName.trim().split(/\s+/);
  const initial = rest.at(-1)?.[0];
  return initial ? `${first} ${initial}.` : first;
}

export default async function ClassementPage(props: PageProps<"/classement">) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const { concours } = await props.searchParams;
  const navUser = await getNavUser();

  const contests = await prisma.contest.findMany({
    where: { isActive: true },
    orderBy: [{ mode: "asc" }, { edition: "desc" }],
    select: { id: true, slug: true, title: true, mode: true, questionCount: true },
  });

  if (contests.length === 0) {
    return (
      <AppShell user={navUser}>
        <PageHeader title="Classement" />
        <p className="card p-10 text-center text-ink-soft">
          Aucun concours n&apos;est ouvert pour le moment.
        </p>
      </AppShell>
    );
  }

  const requested = typeof concours === "string" ? concours : undefined;
  const contest = contests.find((c) => c.slug === requested) ?? contests[0];
  const ranking = await getRankingWithUsers(contest.id);
  const mine = ranking.find((row) => row.userId === user.id);

  return (
    <AppShell user={navUser}>
      <PageHeader
        eyebrow={MODE_LABEL[contest.mode]}
        title="Classement"
        description="Classement automatique par nombre de bonnes réponses, puis par temps total de réponse en cas d'égalité."
      />

      {contests.length > 1 ? (
        <nav className="mb-6 flex flex-wrap gap-2">
          {contests.map((item) => (
            <a
              key={item.id}
              href={`/classement?concours=${item.slug}`}
              aria-current={item.id === contest.id ? "page" : undefined}
              className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                item.id === contest.id
                  ? "bg-brand-500 text-white shadow-[0_3px_0_var(--color-brand-700)]"
                  : "border border-hairline bg-surface text-ink-soft hover:border-hairline-strong hover:text-ink"
              }`}
            >
              {item.title}
            </a>
          ))}
        </nav>
      ) : null}

      {mine ? (
        <section className="hero-dark mb-6 rounded-[1.25rem] p-5 sm:p-6">
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-white/60 uppercase">
                Votre position
              </p>
              <p className="mt-1 font-display text-3xl font-extrabold">
                {formatRank(mine.rank)}
                <span className="ml-2 text-base font-semibold text-white/60">
                  sur {ranking.length}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-extrabold">
                {mine.correctCount}/{contest.questionCount}
              </p>
              <p className="text-sm text-white/60">{formatDuration(mine.totalTimeMs)}</p>
            </div>
          </div>
        </section>
      ) : null}

      {ranking.length === 0 ? (
        <p className="card p-10 text-center text-ink-soft">
          Aucun résultat pour ce concours : le classement s&apos;affichera dès les
          premières participations terminées.
        </p>
      ) : (
        <div className="card overflow-hidden">
          <div className="scroll-slim overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-surface-2 text-ink">
                  <th scope="col" className="px-4 py-3 font-bold">
                    Rang
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Candidat
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Niveau
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">
                    Bonnes réponses
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">
                    Temps total
                  </th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((row) => {
                  const isMe = row.userId === user.id;
                  return (
                    <tr
                      key={row.attemptId}
                      className={`border-t border-hairline ${
                        isMe ? "bg-brand-50 font-semibold" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <RankBadge rank={row.rank} />
                      </td>
                      <td className="px-4 py-3 text-ink">
                        {isMe ? "Vous" : shortName(row.user.fullName)}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {levelText(row.user.educationLevel, row.user.otherLevel)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-ink">
                        {row.correctCount}/{contest.questionCount}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-ink-soft">
                        {formatDuration(row.totalTimeMs)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums">
      {medal ? <span aria-hidden="true">{medal}</span> : null}
      <span className={rank <= 3 ? "font-extrabold text-ink" : "text-ink-soft"}>
        {formatRank(rank)}
      </span>
    </span>
  );
}
