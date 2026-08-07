import { notFound, redirect } from "next/navigation";
import { AppShell, PageHeader } from "@/components/AppShell";
import { ButtonLink } from "@/components/Button";
import { getNavUser, getSessionUserId } from "@/lib/auth";
import { getAttemptResults } from "@/lib/contest";
import { formatDuration } from "@/lib/format";

export const metadata = { title: "Tableau récapitulatif" };

export default async function RecapitulatifPage(
  props: PageProps<"/resultats/[attemptId]/recapitulatif">,
) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");

  const { attemptId } = await props.params;
  const results = await getAttemptResults(attemptId, userId);
  if (!results) notFound();
  if (results.status === "EN_COURS") redirect(`/epreuve/${attemptId}`);

  const navUser = await getNavUser();

  return (
    <AppShell user={navUser}>
      <PageHeader
        eyebrow={results.contest.title}
        title="Tableau récapitulatif"
        description={`${results.correctCount} bonne(s) réponse(s), ${results.wrongCount} fausse(s) et ${results.unansweredCount} non répondue(s) — ${formatDuration(results.totalTimeMs)} au total.`}
        actions={
          <ButtonLink href={`/resultats/${attemptId}`} variant="neutral" size="sm">
            Retour aux résultats
          </ButtonLink>
        }
      />

      {/* Cartes empilées sur mobile : un tableau à 5 colonnes n'y est pas lisible. */}
      <ul className="space-y-3 md:hidden">
        {results.rows.map((row) => (
          <li key={row.position} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-ink">
                <span className="text-brand-600">{row.position}.</span> {row.body}
              </p>
              <ResultBadge isCorrect={row.isCorrect} given={row.given} />
            </div>

            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex gap-2">
                <dt className="w-32 shrink-0 text-ink-faint">Votre réponse</dt>
                <dd className="font-medium text-ink">
                  {row.given ?? <span className="italic text-ink-faint">Non répondue</span>}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-32 shrink-0 text-ink-faint">Bonne réponse</dt>
                <dd className="font-medium text-ok">{row.expected}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-32 shrink-0 text-ink-faint">Temps</dt>
                <dd className="tabular-nums text-ink-soft">{formatDuration(row.timeMs)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <div className="card hidden overflow-hidden md:block">
        <div className="scroll-slim overflow-x-auto">
          <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-surface-2 text-ink">
                <th scope="col" className="px-4 py-3 font-bold">
                  Question
                </th>
                <th scope="col" className="px-4 py-3 font-bold">
                  Réponse du candidat
                </th>
                <th scope="col" className="px-4 py-3 font-bold">
                  Bonne réponse
                </th>
                <th scope="col" className="px-4 py-3 font-bold">
                  Résultat
                </th>
                <th scope="col" className="px-4 py-3 text-right font-bold">
                  Temps
                </th>
              </tr>
            </thead>
            <tbody>
              {results.rows.map((row) => (
                <tr key={row.position} className="border-t border-hairline align-top">
                  <td className="px-4 py-3">
                    <span className="font-bold text-brand-600">{row.position}.</span>{" "}
                    <span className="text-ink">{row.body}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {row.given ?? <span className="italic text-ink-faint">Non répondue</span>}
                  </td>
                  <td className="px-4 py-3 font-medium text-ok">{row.expected}</td>
                  <td className="px-4 py-3">
                    <ResultBadge isCorrect={row.isCorrect} given={row.given} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-soft">
                    {formatDuration(row.timeMs)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-hairline-strong bg-surface-2 font-bold text-ink">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3" colSpan={2}>
                  {results.correctCount} bonne(s), {results.wrongCount} fausse(s),{" "}
                  {results.unansweredCount} non répondue(s)
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {results.correctCount}/{results.total}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatDuration(results.totalTimeMs)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

function ResultBadge({ isCorrect, given }: { isCorrect: boolean; given: string | null }) {
  if (isCorrect) {
    return <span className="pill bg-ok-soft text-ok">✓ Correct</span>;
  }
  if (given === null) {
    return <span className="pill bg-surface-sunken text-ink-faint">— Non répondue</span>;
  }
  return <span className="pill bg-ko-soft text-ko">✗ Incorrect</span>;
}
