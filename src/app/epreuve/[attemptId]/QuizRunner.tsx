"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ServeResult, ServedQuestion } from "@/lib/contest";
import { Button } from "@/components/Button";

type Props = { attemptId: string; initial: ServeResult };

export function QuizRunner({ attemptId, initial }: Props) {
  const router = useRouter();
  const [question, setQuestion] = useState<ServedQuestion | null>(
    initial.kind === "question" ? initial : null,
  );
  const [draft, setDraft] = useState("");
  const [remainingMs, setRemainingMs] = useState(
    initial.kind === "question" ? initial.remainingMs : 0,
  );
  const [submitting, setSubmitting] = useState(false);

  // Le brouillon est lu depuis l'expiration du chrono, qui ne doit pas dépendre
  // du rendu en cours : on le garde aussi dans une ref.
  const draftRef = useRef("");
  const submittingRef = useRef(false);
  const positionRef = useRef(initial.kind === "question" ? initial.position : null);
  // Échéance absolue de la question courante, recalculée à chaque question
  // servie à partir du temps restant annoncé par le serveur.
  const deadlineRef = useRef(0);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const applyResult = useCallback(
    (result: ServeResult) => {
      if (result.kind === "finished") {
        router.replace(`/resultats/${attemptId}`);
        return;
      }
      // La saisie n'est effacée qu'en changeant de question : la resynchronisation
      // au montage renvoie la question courante et ne doit pas faire perdre au
      // candidat la réponse qu'il vient de sélectionner.
      if (positionRef.current !== result.position) {
        positionRef.current = result.position;
        setDraft("");
        draftRef.current = "";
      }
      setQuestion(result);
      setRemainingMs(result.remainingMs);
    },
    [attemptId, router],
  );

  const send = useCallback(
    async (position: number, given: string | null) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      try {
        const res = await fetch(`/api/epreuve/${attemptId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position, given }),
        });
        if (!res.ok) throw new Error("submit failed");
        applyResult((await res.json()) as ServeResult);
      } catch {
        // Réseau indisponible : on laisse le serveur arbitrer au prochain chargement.
        router.refresh();
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [attemptId, applyResult, router],
  );

  // Au montage, on demande la question au serveur : c'est cet appel qui arme le
  // chrono côté serveur et renvoie le temps restant faisant foi. Le rendu initial
  // affiche déjà la question, il n'y a donc pas d'écran d'attente.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(`/api/epreuve/${attemptId}`);
        if (!res.ok || cancelled) return;
        applyResult((await res.json()) as ServeResult);
      } catch {
        // Hors ligne : le décompte local sert de repli, le serveur arbitrera.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attemptId, applyResult]);

  // Chrono : décompte visuel, puis envoi automatique à l'expiration.
  useEffect(() => {
    if (!question) return;

    deadlineRef.current = Date.now() + question.remainingMs;

    const tick = () => {
      const left = Math.max(0, deadlineRef.current - Date.now());
      setRemainingMs(left);
      if (left === 0) {
        clearInterval(timer);
        const value = draftRef.current.trim();
        void send(question.position, value === "" ? null : value);
      }
    };

    const timer = setInterval(tick, 200);
    tick();
    return () => clearInterval(timer);
  }, [question, send]);

  if (!question) return null;

  const seconds = Math.ceil(remainingMs / 1000);
  const ratio = question.limitMs > 0 ? remainingMs / question.limitMs : 0;
  const urgent = seconds <= 5;
  const warning = !urgent && seconds <= 10;

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 -mx-4 border-b border-hairline bg-surface/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-lg font-extrabold text-ink">
                Question {question.position}
              </span>
              <span className="text-sm font-semibold text-ink-faint">
                sur {question.total}
              </span>
            </div>

            {/* Progression dans l'épreuve (questions traitées, pas le chrono). */}
            <div
              className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={question.total}
              aria-valuenow={question.position}
              aria-label="Progression dans l'épreuve"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-400 to-violet-500 transition-[width] duration-300"
                style={{ width: `${(question.position / question.total) * 100}%` }}
              />
            </div>
          </div>

          <div
            className={`timer-ring shrink-0 ${
              urgent ? "timer-ring--danger" : warning ? "timer-ring--warn" : ""
            }`}
            style={{ ["--progress" as string]: ratio }}
          >
            <span
              aria-live="off"
              className={`relative z-10 text-center leading-none font-display font-extrabold tabular-nums ${
                urgent ? "text-ko" : "text-ink"
              }`}
            >
              <span className="block text-xl">{seconds}</span>
              <span className="block text-[0.6rem] font-bold text-ink-faint">sec</span>
            </span>
          </div>
        </div>
        <span className="sr-only" aria-live="polite">
          {urgent ? `${seconds} secondes restantes` : ""}
        </span>
      </header>

      <div className="flex flex-1 flex-col py-6">
        <div className="hero-dark rounded-[1.5rem] px-6 py-9 sm:px-10 sm:py-12">
          <p className="relative z-10 text-center font-display text-xl leading-snug font-bold text-balance sm:text-2xl">
            {question.body}
          </p>
        </div>

        {question.type === "QCM" ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {question.choices.map((choice) => {
              const selected = draft === choice.label;
              return (
                <button
                  key={choice.label}
                  type="button"
                  aria-pressed={selected}
                  disabled={submitting}
                  onClick={() => setDraft(selected ? "" : choice.label)}
                  className="answer-tile"
                >
                  <span className="answer-tile__key" aria-hidden="true">
                    {choice.label}
                  </span>
                  <span className="leading-snug">{choice.text}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-6">
            <label htmlFor="reponse-libre" className="text-sm font-bold text-ink">
              Saisir la réponse
            </label>
            <input
              id="reponse-libre"
              key={question.position}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={submitting}
              autoComplete="off"
              autoFocus
              placeholder="Votre réponse"
              className="mt-2.5 w-full rounded-2xl border border-hairline bg-surface-2 px-5 py-6 text-center font-display text-2xl font-bold text-ink shadow-[inset_0_2px_6px_rgb(15_20_53_/_0.07)] transition placeholder:font-normal placeholder:text-ink-faint focus:border-brand-400 focus:bg-surface focus:outline-2 focus:outline-offset-2 focus:outline-brand-500 disabled:opacity-60"
            />
          </div>
        )}

        <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-ink-faint">
          <span aria-hidden="true">🔒</span>
          Votre réponse est enregistrée automatiquement à la fin du temps imparti.
        </p>

        <div className="mt-auto pt-8">
          <Button
            type="button"
            variant={question.position === question.total ? "ok" : "brand"}
            size="lg"
            block
            disabled={submitting}
            onClick={() => {
              const value = draft.trim();
              void send(question.position, value === "" ? null : value);
            }}
          >
            {question.position === question.total
              ? "Valider et terminer l'épreuve"
              : "Valider et passer à la suite"}
          </Button>
          <p className="mt-2.5 text-center text-xs text-ink-faint">
            Une fois validée, il n&apos;est plus possible de revenir en arrière.
          </p>
        </div>
      </div>
    </div>
  );
}
