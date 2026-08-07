import { notFound } from "next/navigation";
import { AdminShell, Crumbs, StatCard } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { getUserRank } from "@/lib/ranking";
import { formatDate, formatDuration, formatRank } from "@/lib/format";
import { CITY_LABEL, GENDER_LABEL, levelText } from "@/lib/labels";

export const metadata = { title: "Participation" };

export default async function AdminParticipationPage(
  props: PageProps<"/admin/participations/[attemptId]">,
) {
  await requireAdmin();
  const { attemptId } = await props.params;

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      user: true,
      contest: { select: { id: true, title: true, questionCount: true } },
      answers: {
        orderBy: { position: "asc" },
        include: { question: { select: { body: true, correctAnswer: true, type: true } } },
      },
    },
  });
  if (!attempt) notFound();

  const ranking =
    attempt.status === "TERMINEE"
      ? await getUserRank(attempt.contestId, attempt.userId)
      : null;

  return (
    <AdminShell
      title={attempt.user.fullName}
      breadcrumb={
        <Crumbs
          items={[
            { href: "/admin", label: "Administration" },
            { href: "/admin/candidats", label: "Candidats" },
            { label: attempt.contest.title },
          ]}
        />
      }
      description={
        <>
          {attempt.user.email} · {attempt.user.phone} ·{" "}
          {levelText(attempt.user.educationLevel, attempt.user.otherLevel)} ·{" "}
          {CITY_LABEL[attempt.user.city]} · {GENDER_LABEL[attempt.user.gender]}
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Score"
          value={`${attempt.correctCount}/${attempt.contest.questionCount}`}
        />
        <StatCard label="Non répondues" value={attempt.unansweredCount} tone="gold" />
        <StatCard
          label="Temps total"
          value={formatDuration(attempt.totalTimeMs)}
          tone="violet"
        />
        <StatCard
          label="Classement"
          value={ranking ? formatRank(ranking.rank) : "—"}
          hint={ranking ? `sur ${ranking.total} candidats` : "Épreuve non terminée"}
          tone="ok"
        />
      </div>

      <p className="mt-4 text-sm text-ink-faint">
        Démarrée le {formatDate(attempt.startedAt)}
        {attempt.finishedAt ? ` · terminée le ${formatDate(attempt.finishedAt)}` : ""}
      </p>

      <div className="card mt-6 overflow-hidden">
        <div className="scroll-slim overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-surface-2 text-ink">
                <th scope="col" className="px-4 py-3 font-bold">Question</th>
                <th scope="col" className="px-4 py-3 font-bold">Réponse</th>
                <th scope="col" className="px-4 py-3 font-bold">Attendu</th>
                <th scope="col" className="px-4 py-3 font-bold">Résultat</th>
                <th scope="col" className="px-4 py-3 text-right font-bold">Temps</th>
              </tr>
            </thead>
            <tbody>
              {attempt.answers.map((answer) => (
                <tr key={answer.id} className="border-t border-hairline align-top">
                  <td className="px-4 py-3">
                    <span className="font-bold text-brand-600">{answer.position}.</span>{" "}
                    <span className="text-ink">{answer.question.body}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {answer.given ?? (
                      <span className="italic text-ink-faint">Non répondue</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ok">
                    {answer.question.correctAnswer.split("|")[0].trim()}
                  </td>
                  <td className="px-4 py-3">
                    {answer.isCorrect ? (
                      <span className="pill bg-ok-soft text-ok">Correct</span>
                    ) : answer.given === null ? (
                      <span className="pill bg-surface-sunken text-ink-faint">Non répondue</span>
                    ) : (
                      <span className="pill bg-ko-soft text-ko">Incorrect</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-soft">
                    {formatDuration(answer.timeMs)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
