import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell, Crumbs } from "@/components/AdminShell";
import { ButtonLink } from "@/components/Button";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { toDateTimeLocal } from "@/lib/format";
import { ContestForm } from "@/app/admin/ContestForm";
import { deleteQuestionAction, moveQuestionAction } from "@/app/admin/actions";
import { DeleteContest } from "./DeleteContest";

export default async function EditerConcoursPage(props: PageProps<"/admin/concours/[id]">) {
  await requireAdmin();
  const { id } = await props.params;

  const contest = await prisma.contest.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { position: "asc" }, include: { choices: true } },
      _count: { select: { attempts: true } },
    },
  });
  if (!contest) notFound();

  return (
    <AdminShell
      title={contest.title}
      breadcrumb={
        <Crumbs
          items={[
            { href: "/admin", label: "Administration" },
            { href: "/admin/concours", label: "Concours" },
            { label: contest.title },
          ]}
        />
      }
      actions={
        <>
          <ButtonLink
            href={`/admin/concours/${contest.id}/questions/import`}
            variant="neutral"
            size="sm"
          >
            Importer des questions
          </ButtonLink>
          <ButtonLink
            href={`/admin/concours/${contest.id}/participants`}
            variant="neutral"
            size="sm"
          >
            Participations ({contest._count.attempts})
          </ButtonLink>
        </>
      }
    >
      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">
            Questions ({contest.questions.length})
          </h2>
          <ButtonLink
            href={`/admin/concours/${contest.id}/questions/nouvelle`}
            variant="brand"
            size="sm"
          >
            Ajouter une question
          </ButtonLink>
        </div>

        {contest.questions.length === 0 ? (
          <p className="rounded-md border border-dashed border-hairline-strong px-4 py-8 text-center text-sm text-ink-faint">
            Aucune question. Le concours ne peut pas encore être passé.
          </p>
        ) : (
          <ul className="space-y-2">
            {contest.questions.map((question, index) => (
              <li
                key={question.id}
                className="flex flex-wrap items-start gap-x-4 gap-y-2 rounded-md border border-hairline px-3 py-2"
              >
                <span className="mt-0.5 w-6 shrink-0 text-sm font-semibold text-ink">
                  {question.position}.
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">{question.body}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {question.type === "QCM"
                      ? `QCM — bonne réponse ${question.correctAnswer}`
                      : `Réponse libre — attendu « ${question.correctAnswer.split("|")[0].trim() } »`}
                    {question.points !== 1 ? ` · ${question.points} points` : null}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <form action={moveQuestionAction}>
                    <input type="hidden" name="contestId" value={contest.id} />
                    <input type="hidden" name="questionId" value={question.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button
                      type="submit"
                      disabled={index === 0}
                      aria-label={`Monter la question ${question.position}`}
                      className="rounded px-2 py-1 text-sm text-brand-700 hover:bg-brand-50 disabled:opacity-30"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={moveQuestionAction}>
                    <input type="hidden" name="contestId" value={contest.id} />
                    <input type="hidden" name="questionId" value={question.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      disabled={index === contest.questions.length - 1}
                      aria-label={`Descendre la question ${question.position}`}
                      className="rounded px-2 py-1 text-sm text-brand-700 hover:bg-brand-50 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </form>

                  <Link
                    href={`/admin/concours/${contest.id}/questions/${question.id}`}
                    className="text-sm font-medium text-brand-600 underline"
                  >
                    Modifier
                  </Link>

                  <form action={deleteQuestionAction}>
                    <input type="hidden" name="contestId" value={contest.id} />
                    <input type="hidden" name="questionId" value={question.id} />
                    <button
                      type="submit"
                      className="text-sm font-medium text-ko underline"
                    >
                      Supprimer
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-ink">Paramètres</h2>
        <ContestForm
          contest={{
            id: contest.id,
            title: contest.title,
            slug: contest.slug,
            mode: contest.mode,
            instructions: contest.instructions,
            information: contest.information ?? "",
            secondsPerQuestion: contest.secondsPerQuestion,
            edition: contest.edition,
            isActive: contest.isActive,
            startsAt: toDateTimeLocal(contest.startsAt),
            opensAt: toDateTimeLocal(contest.opensAt),
            closesAt: toDateTimeLocal(contest.closesAt),
          }}
        />
      </section>

      <section className="mt-10 border-t border-hairline pt-6">
        <h2 className="text-base font-semibold text-ko">Supprimer le concours</h2>
        <DeleteContest
          contestId={contest.id}
          slug={contest.slug}
          questionCount={contest.questions.length}
          attemptCount={contest._count.attempts}
        />
      </section>
    </AdminShell>
  );
}
