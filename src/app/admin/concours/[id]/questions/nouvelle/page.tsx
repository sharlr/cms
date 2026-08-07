import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { QuestionForm } from "@/app/admin/QuestionForm";

export default async function NouvelleQuestionPage(
  props: PageProps<"/admin/concours/[id]/questions/nouvelle">,
) {
  await requireAdmin();
  const { id } = await props.params;

  const contest = await prisma.contest.findUnique({
    where: { id },
    select: { id: true, title: true },
  });
  if (!contest) notFound();

  return (
    <AdminShell
      title="Nouvelle question"
      breadcrumb={
        <>
          <Link href="/admin" className="underline">
            Administration
          </Link>
          {" › "}
          <Link href={`/admin/concours/${contest.id}`} className="underline">
            {contest.title}
          </Link>
        </>
      }
    >
      <QuestionForm
        contestId={contest.id}
        question={{
          body: "",
          type: "QCM",
          points: 1,
          choices: {},
          correctLabel: "",
          correctText: "",
          explanation: "",
        }}
      />
    </AdminShell>
  );
}
