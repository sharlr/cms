import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { QuestionForm } from "@/app/admin/QuestionForm";

export default async function EditerQuestionPage(
  props: PageProps<"/admin/concours/[id]/questions/[questionId]">,
) {
  await requireAdmin();
  const { id, questionId } = await props.params;

  const question = await prisma.question.findFirst({
    where: { id: questionId, contestId: id },
    include: { choices: true, contest: { select: { id: true, title: true } } },
  });
  if (!question) notFound();

  const choices: Record<string, string> = {};
  for (const choice of question.choices) choices[choice.label] = choice.text;

  return (
    <AdminShell
      title={`Question ${question.position}`}
      breadcrumb={
        <>
          <Link href="/admin" className="underline">
            Administration
          </Link>
          {" › "}
          <Link href={`/admin/concours/${question.contest.id}`} className="underline">
            {question.contest.title}
          </Link>
        </>
      }
    >
      <QuestionForm
        contestId={question.contest.id}
        question={{
          id: question.id,
          body: question.body,
          type: question.type,
          points: question.points,
          choices,
          correctLabel: question.type === "QCM" ? question.correctAnswer : "",
          correctText: question.type === "QCM" ? "" : question.correctAnswer,
          explanation: question.explanation ?? "",
        }}
      />
    </AdminShell>
  );
}
