"use client";

import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { NewsCard } from "@/components/NewsCard";
import { ButtonLink } from "@/components/Button";
import { useLanguage } from "@/i18n";
import { formatOfficial } from "@/lib/format";
import type { Availability } from "@/lib/availability";
import type { Contest, News, Attempt } from "@/generated/prisma";

export function HomeContent({
  user,
  contests,
  news,
  lastAttempt,
  availabilityMap,
}: {
  user: { id: string; fullName: string };
  contests: Contest[];
  news: News[];
  lastAttempt: (Attempt & { contest: { title: string; questionCount: number } }) | null;
  availabilityMap: Record<string, Availability>;
}) {
  const { t } = useLanguage();

  const selection = contests.find((c) => c.mode === "SELECTION");
  const trainings = contests.filter((c) => c.mode === "ENTRAINEMENT");
  const information = selection?.information ?? trainings[0]?.information;

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-bold tracking-[0.18em] text-brand-600 uppercase">
          {t("tagline")}
        </p>
        <h1 className="mt-1.5 text-3xl font-extrabold text-ink sm:text-4xl">
          {t("home.greeting", { name: user.fullName.split(" ")[0] })}
        </h1>
        <p className="mt-1.5 text-ink-soft">
          {t("home.chooseContest")}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {selection ? (
            <SelectionCard
              contest={selection}
              availability={availabilityMap[selection.id]}
              t={t}
            />
          ) : null}

          {trainings.length > 0 ? (
            <section>
              <h2 className="mb-3 text-lg font-extrabold text-ink">{t("home.training")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {trainings.map((contest) => (
                  <TrainingCard
                    key={contest.id}
                    contest={contest}
                    availability={availabilityMap[contest.id]}
                    t={t}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-5">
          {lastAttempt ? (
            <section className="card p-5">
              <h2 className="text-sm font-bold tracking-[0.14em] text-ink-faint uppercase">
                {t("home.lastResult")}
              </h2>
              <p className="mt-2 truncate text-sm font-semibold text-ink">
                {lastAttempt.contest.title}
              </p>
              <p className="stat mt-2 text-brand-600">
                {lastAttempt.correctCount}
                <span className="text-xl text-ink-faint">
                  /{lastAttempt.contest.questionCount}
                </span>
              </p>
              <Link
                href={`/resultats/${lastAttempt.id}`}
                className="mt-3 inline-block text-sm font-semibold text-brand-600 underline-offset-4 hover:underline"
              >
                {t("home.seeDetails")}
              </Link>
            </section>
          ) : null}

          <section className="card overflow-hidden">
            <div className="border-b border-hairline bg-surface-2 px-5 py-3">
              <h2 className="text-sm font-bold tracking-[0.14em] text-ink-faint uppercase">
                {t("home.information")}
              </h2>
            </div>
            <p className="p-5 text-[0.925rem] leading-relaxed text-ink-soft">
              {information ?? t("home.informationPlaceholder")}
            </p>
          </section>

          <div className="grid gap-2">
            <ButtonLink href="/classement" variant="neutral" block>
              {t("home.seeRanking")}
            </ButtonLink>
            <ButtonLink href="/historique" variant="ghost" block>
              {t("home.myParticipations")}
            </ButtonLink>
          </div>
        </aside>
      </div>

      {news.length > 0 ? (
        <section className="mt-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-extrabold text-ink">Actualités</h2>
            <Link
              href="/actualites"
              className="text-sm font-semibold text-brand-600 underline-offset-4 hover:underline"
            >
              {t("home.viewAll")}
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {news.map((item) => (
              <NewsCard key={item.id} news={item} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function SelectionCard({
  contest,
  availability,
  t,
}: {
  contest: Contest;
  availability: Availability;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}) {
  const locked = availability.state !== "open";

  return (
    <section className="hero-dark rounded-[1.5rem] p-6 sm:p-8">
      <div className="relative z-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill bg-gold-400/20 text-gold-200 ring-1 ring-gold-300/30">
            {t("contest.edition", { edition: contest.edition })}
          </span>
          {locked ? (
            <span className="pill bg-white/10 text-white/70 ring-1 ring-white/20">
              {t("contest.locked")}
            </span>
          ) : (
            <span className="pill bg-ok/20 text-emerald-200 ring-1 ring-emerald-300/30">
              {t("contest.open")}
            </span>
          )}
        </div>

        <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">{contest.title}</h2>
        <p className="mt-2 max-w-lg text-[0.95rem] text-white/70">
          {t("contest.questions", { count: contest.questionCount })} · {t("contest.secondsPerQuestion", { seconds: contest.secondsPerQuestion })} · {t("contest.singleParticipation")}
        </p>

        {availability.state === "scheduled" ? (
          <div className="mt-6 max-w-md">
            <p className="mb-2 text-sm font-semibold text-white/75">
              {t("contest.openingDate", { date: formatOfficial(availability.startsAt) })}
            </p>
            <Countdown target={availability.startsAt.toISOString()} tone="light" />
          </div>
        ) : null}

        <div className="mt-6">
          {availability.state === "open" ? (
            <ButtonLink href={`/consignes/${contest.slug}`} variant="gold" size="lg">
              {t("contest.startContest")}
            </ButtonLink>
          ) : (
            <p className="text-sm text-white/60">
              {availability.state === "scheduled"
                ? t("contest.buttonActivates")
                : availability.state === "closed"
                  ? t("contest.contestClosed")
                  : availability.state === "empty"
                    ? t("contest.noQuestions")
                    : t("contest.notOpened")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function TrainingCard({
  contest,
  availability,
  t,
}: {
  contest: Contest;
  availability: Availability;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}) {
  const open = availability.state === "open";

  return (
    <article className="card flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-ink">{contest.title}</h3>
        <span className="pill shrink-0 bg-brand-50 text-brand-700">
          {contest.edition}
        </span>
      </div>
      <p className="mt-1.5 flex-1 text-sm text-ink-soft">
        {t("contest.questions", { count: contest.questionCount })} · {t("contest.secondsPerQuestion", { seconds: contest.secondsPerQuestion })}
      </p>
      <div className="mt-4">
        {open ? (
          <ButtonLink href={`/consignes/${contest.slug}`} variant="brand" size="sm" block>
            {t("contest.train")}
          </ButtonLink>
        ) : (
          <p className="text-xs font-medium text-ink-faint">
            {availability.state === "empty"
              ? t("contest.noPublishedQuestions")
              : t("contest.unavailable")}
          </p>
        )}
      </div>
    </article>
  );
}
