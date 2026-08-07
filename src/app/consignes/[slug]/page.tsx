import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Countdown } from "@/components/Countdown";
import { getNavUser, getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { availabilityOf } from "@/lib/availability";
import { formatOfficial } from "@/lib/format";
import { MODE_LABEL } from "@/lib/labels";
import { StartButton } from "./StartButton";

export default async function ConsignesPage(props: PageProps<"/consignes/[slug]">) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");

  const { slug } = await props.params;
  const contest = await prisma.contest.findUnique({ where: { slug } });
  if (!contest) notFound();

  const navUser = await getNavUser();
  const availability = availabilityOf(contest);
  const rules = contest.instructions.split("\n").map((r) => r.trim()).filter(Boolean);

  return (
    <AppShell user={navUser} width="narrow">
      <div className="rise">
        <p className="text-xs font-bold tracking-[0.18em] text-brand-600 uppercase">
          {MODE_LABEL[contest.mode]} · Édition {contest.edition}
        </p>
        <h1 className="mt-1.5 text-3xl font-extrabold text-ink sm:text-4xl">
          {contest.title}
        </h1>

        <dl className="mt-6 grid grid-cols-3 gap-3">
          <Metric value={String(contest.questionCount)} label="questions" />
          <Metric value={`${contest.secondsPerQuestion} s`} label="par question" />
          <Metric
            value={contest.mode === "SELECTION" ? "1" : "∞"}
            label={contest.mode === "SELECTION" ? "participation" : "essais"}
          />
        </dl>

        <section className="card mt-6 p-6">
          <h2 className="text-lg font-extrabold text-ink">Consignes</h2>
          <ul className="mt-4 space-y-3">
            {rules.map((rule, index) => (
              <li key={index} className="flex gap-3 text-[0.95rem] leading-relaxed text-ink-soft">
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-50 text-[0.7rem] font-bold text-brand-600"
                >
                  {index + 1}
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-6">
          {availability.state === "open" ? (
            <StartButton slug={contest.slug} />
          ) : availability.state === "scheduled" ? (
            <div className="card border-gold-300/50 bg-gold-100/40 p-6">
              <h2 className="font-extrabold text-ink">L&apos;épreuve n&apos;a pas encore commencé</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Ouverture le {formatOfficial(availability.startsAt)}.
              </p>
              <div className="mt-4">
                <Countdown target={availability.startsAt.toISOString()} />
              </div>
              <p className="mt-3 text-xs text-ink-faint">
                Cette page s&apos;actualisera d&apos;elle-même à l&apos;heure officielle.
              </p>
            </div>
          ) : (
            <div className="card border-ko/25 bg-ko-soft p-6">
              <p className="font-semibold text-ko">
                {availability.state === "closed"
                  ? "Ce concours est clôturé."
                  : availability.state === "empty"
                    ? "Ce concours ne comporte pas encore de questions."
                    : "Ce concours n'est pas disponible pour le moment."}
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="card px-4 py-3 text-center">
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block font-display text-2xl font-extrabold text-brand-600">
          {value}
        </span>
        <span className="text-xs font-semibold text-ink-faint">{label}</span>
      </dd>
    </div>
  );
}
