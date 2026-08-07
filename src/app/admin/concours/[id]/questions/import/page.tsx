import { notFound } from "next/navigation";
import { AdminShell, Crumbs } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { ImportForm } from "./ImportForm";

export const metadata = { title: "Importer des questions" };

export default async function ImportQuestionsPage(
  props: PageProps<"/admin/concours/[id]/questions/import">,
) {
  await requireAdmin();
  const { id } = await props.params;

  const contest = await prisma.contest.findUnique({
    where: { id },
    select: { id: true, title: true, questionCount: true },
  });
  if (!contest) notFound();

  return (
    <AdminShell
      title="Importer des questions"
      breadcrumb={
        <Crumbs
          items={[
            { href: "/admin", label: "Administration" },
            { href: "/admin/concours", label: "Concours" },
            { href: `/admin/concours/${contest.id}`, label: contest.title },
            { label: "Import" },
          ]}
        />
      }
      description={`Ce concours comporte actuellement ${contest.questionCount} question(s).`}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="card p-6">
          <ImportForm contestId={contest.id} />
        </div>

        <aside className="card h-fit p-5">
          <h2 className="text-sm font-bold tracking-[0.14em] text-ink-faint uppercase">
            Format attendu
          </h2>
          <p className="mt-3 text-sm text-ink-soft">
            La première ligne du classeur est l&apos;en-tête. Les colonnes doivent se
            suivre dans cet ordre&nbsp;:
          </p>
          <ol className="mt-3 space-y-1.5 text-sm text-ink-soft">
            {[
              "Type — QCM ou LIBRE",
              "Énoncé",
              "Réponse A",
              "Réponse B",
              "Réponse C",
              "Réponse D",
              "Bonne réponse",
              "Points",
            ].map((label, index) => (
              <li key={label} className="flex gap-2">
                <span className="font-bold text-brand-600 tabular-nums">{index + 1}.</span>
                {label}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs leading-relaxed text-ink-faint">
            Pour un QCM, la bonne réponse est la lettre A, B, C ou D. Pour une question
            libre, saisissez les formulations acceptées séparées par «&nbsp;|&nbsp;»,
            par exemple <code className="rounded bg-surface-sunken px-1">15 | quinze</code>.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-ink-faint">
            L&apos;import est appliqué en totalité ou pas du tout : si une ligne est
            invalide, rien n&apos;est enregistré.
          </p>
        </aside>
      </div>
    </AdminShell>
  );
}
