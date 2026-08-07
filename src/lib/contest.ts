import { prisma } from "@/lib/prisma";
import { isAnswerCorrect, verdictFor } from "@/lib/grading";
import { availabilityMessage, availabilityOf } from "@/lib/availability";
import { getUserRank } from "@/lib/ranking";
import type { QuestionType } from "@/generated/prisma";

/**
 * Marge de tolérance réseau : une réponse qui arrive jusqu'à 2 s après
 * l'expiration du chrono est encore acceptée. Au-delà, la question est
 * comptée comme non répondue.
 */
const GRACE_MS = 2000;

export type ServedQuestion = {
  kind: "question";
  attemptId: string;
  position: number;
  total: number;
  type: QuestionType;
  body: string;
  imageUrl: string | null;
  choices: { label: string; text: string }[];
  remainingMs: number;
  limitMs: number;
};

export type AttemptFinished = { kind: "finished"; attemptId: string };

export type ServeResult = ServedQuestion | AttemptFinished;

/** Démarre une tentative, ou reprend celle déjà en cours pour ce concours. */
export async function startAttempt(userId: string, contestSlug: string) {
  const contest = await prisma.contest.findUnique({
    where: { slug: contestSlug },
    select: {
      id: true,
      mode: true,
      isActive: true,
      questionCount: true,
      startsAt: true,
      opensAt: true,
      closesAt: true,
    },
  });
  if (!contest) throw new Error("Concours introuvable.");

  // L'heure officielle fait foi côté serveur : un client dont l'horloge avance
  // ne peut pas démarrer l'épreuve avant tout le monde.
  const availability = availabilityOf(contest);
  if (availability.state !== "open") {
    throw new Error(availabilityMessage(availability) ?? "Ce concours n'est pas disponible.");
  }

  const inProgress = await prisma.attempt.findFirst({
    where: { userId, contestId: contest.id, status: "EN_COURS" },
    orderBy: { startedAt: "desc" },
  });
  if (inProgress) return inProgress;

  // Le concours de sélection n'est jouable qu'une seule fois.
  if (contest.mode === "SELECTION") {
    const done = await prisma.attempt.findFirst({
      where: { userId, contestId: contest.id, status: "TERMINEE" },
    });
    if (done) {
      throw new Error(
        "Vous avez déjà passé le concours de sélection. Une seule participation est autorisée.",
      );
    }
  }

  return prisma.attempt.create({
    data: { userId, contestId: contest.id },
  });
}

/**
 * Renvoie la question courante d'une tentative.
 *
 * Si le chrono de la question précédemment servie a expiré sans réponse
 * (candidat qui ferme l'application, perte de réseau…), les questions
 * concernées sont enregistrées comme non répondues avant de servir la suivante.
 */
export async function serveCurrentQuestion(
  attemptId: string,
  userId: string,
  options: { startClock?: boolean } = {},
): Promise<ServeResult> {
  const { startClock = true } = options;
  const attempt = await loadAttempt(attemptId, userId);

  if (attempt.status !== "EN_COURS") {
    return { kind: "finished", attemptId };
  }

  const limitMs = attempt.contest.secondsPerQuestion * 1000;
  const questions = attempt.contest.questions;
  const total = questions.length;

  let position = attempt.currentPosition;
  let servedAt = attempt.questionServedAt;

  // Rattrapage des questions dont le temps est écoulé pendant l'absence du client.
  while (position <= total && servedAt && Date.now() - servedAt.getTime() > limitMs + GRACE_MS) {
    const question = questions[position - 1];
    await recordAnswer(attempt.id, question.id, position, null, false, limitMs);
    position += 1;
    servedAt = null;
  }

  if (position > total) {
    await prisma.attempt.update({
      where: { id: attempt.id },
      data: { currentPosition: position, questionServedAt: null },
    });
    await finalizeAttempt(attempt.id);
    return { kind: "finished", attemptId };
  }

  // Première présentation de cette question : le chrono démarre maintenant.
  //
  // Le rendu serveur de la page appelle cette fonction avec `startClock: false` :
  // il se contente de montrer la question sans lancer le décompte. Le chrono est
  // armé par la requête que le client émet une fois monté, afin que les 30 s du
  // candidat et celles du serveur commencent au même instant — sinon le délai
  // d'hydratation est décompté côté serveur uniquement, et la réponse envoyée à
  // l'expiration arrive après la date limite.
  if (!servedAt) {
    if (!startClock) {
      const pending = questions[position - 1];
      return {
        kind: "question",
        attemptId,
        position,
        total,
        type: pending.type,
        body: pending.body,
        imageUrl: pending.imageUrl,
        choices: pending.choices.map((c) => ({ label: c.label, text: c.text })),
        remainingMs: limitMs,
        limitMs,
      };
    }

    servedAt = new Date();
    await prisma.attempt.update({
      where: { id: attempt.id },
      data: { currentPosition: position, questionServedAt: servedAt },
    });
  }

  const question = questions[position - 1];
  const elapsed = Date.now() - servedAt.getTime();

  return {
    kind: "question",
    attemptId,
    position,
    total,
    type: question.type,
    body: question.body,
    imageUrl: question.imageUrl,
    choices: question.choices.map((c) => ({ label: c.label, text: c.text })),
    remainingMs: Math.max(0, limitMs - elapsed),
    limitMs,
  };
}

/**
 * Enregistre la réponse à la question courante et avance d'une question.
 * `given` à `null` correspond à une absence de réponse dans le temps imparti.
 */
export async function submitAnswer(
  attemptId: string,
  userId: string,
  position: number,
  given: string | null,
): Promise<ServeResult> {
  const attempt = await loadAttempt(attemptId, userId);

  if (attempt.status !== "EN_COURS") {
    return { kind: "finished", attemptId };
  }

  // Retour en arrière impossible : seule la question courante est acceptée.
  if (position !== attempt.currentPosition) {
    return serveCurrentQuestion(attemptId, userId);
  }

  const limitMs = attempt.contest.secondsPerQuestion * 1000;
  const question = attempt.contest.questions[position - 1];
  if (!question) return serveCurrentQuestion(attemptId, userId);

  const servedAt = attempt.questionServedAt ?? new Date();
  const elapsed = Date.now() - servedAt.getTime();

  // Réponse arrivée trop tard : comptée comme non répondue.
  const effective = elapsed > limitMs + GRACE_MS ? null : given;
  const trimmed = effective && effective.trim() !== "" ? effective.trim() : null;
  const correct = isAnswerCorrect(question.type, trimmed, question.correctAnswer);

  await recordAnswer(
    attempt.id,
    question.id,
    position,
    trimmed,
    correct,
    Math.min(elapsed, limitMs),
  );

  await prisma.attempt.update({
    where: { id: attempt.id },
    data: { currentPosition: position + 1, questionServedAt: null },
  });

  if (position + 1 > attempt.contest.questions.length) {
    await finalizeAttempt(attempt.id);
    return { kind: "finished", attemptId };
  }

  return serveCurrentQuestion(attemptId, userId);
}

/** Agrège les compteurs et clôture la tentative (idempotent). */
export async function finalizeAttempt(attemptId: string) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: { include: { question: { select: { points: true } } } },
      contest: { select: { questionCount: true } },
    },
  });
  if (!attempt || attempt.status === "TERMINEE") return;

  const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
  const unansweredCount = attempt.answers.filter((a) => a.given === null).length;
  const wrongCount = attempt.answers.length - correctCount - unansweredCount;
  const score = attempt.answers
    .filter((a) => a.isCorrect)
    .reduce((sum, a) => sum + a.question.points, 0);
  const totalTimeMs = attempt.answers.reduce((sum, a) => sum + a.timeMs, 0);

  await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      status: "TERMINEE",
      finishedAt: new Date(),
      correctCount,
      wrongCount,
      unansweredCount,
      score,
      totalTimeMs,
    },
  });
}

/** Résultats détaillés : totaux, verdict et tableau récapitulatif. */
export async function getAttemptResults(attemptId: string, userId: string) {
  const attempt = await prisma.attempt.findFirst({
    where: { id: attemptId, userId },
    include: {
      contest: {
        select: { id: true, title: true, slug: true, mode: true, questionCount: true },
      },
      answers: {
        orderBy: { position: "asc" },
        include: {
          question: {
            select: { body: true, type: true, correctAnswer: true, choices: true },
          },
        },
      },
    },
  });
  if (!attempt) return null;

  const total = attempt.answers.length || attempt.contest.questionCount;

  // Le classement n'a de sens qu'une fois l'épreuve terminée.
  const ranking =
    attempt.status === "TERMINEE"
      ? await getUserRank(attempt.contest.id, userId)
      : null;

  return {
    id: attempt.id,
    contest: attempt.contest,
    status: attempt.status,
    ranking,
    startedAt: attempt.startedAt,
    finishedAt: attempt.finishedAt,
    correctCount: attempt.correctCount,
    wrongCount: attempt.wrongCount,
    unansweredCount: attempt.unansweredCount,
    score: attempt.score,
    totalTimeMs: attempt.totalTimeMs,
    total,
    verdict: verdictFor(attempt.correctCount, total),
    rows: attempt.answers.map((a) => ({
      position: a.position,
      body: a.question.body,
      given: displayAnswer(a.question.type, a.given, a.question.choices),
      expected: displayExpected(a.question.type, a.question.correctAnswer, a.question.choices),
      isCorrect: a.isCorrect,
      timeMs: a.timeMs,
    })),
  };
}

// ------------------------------------------------------------------ internes

async function loadAttempt(attemptId: string, userId: string) {
  const attempt = await prisma.attempt.findFirst({
    where: { id: attemptId, userId },
    include: {
      contest: {
        select: {
          secondsPerQuestion: true,
          questions: {
            orderBy: { position: "asc" },
            include: { choices: { orderBy: { label: "asc" } } },
          },
        },
      },
    },
  });
  if (!attempt) throw new Error("Tentative introuvable.");
  return attempt;
}

function recordAnswer(
  attemptId: string,
  questionId: string,
  position: number,
  given: string | null,
  isCorrect: boolean,
  timeMs: number,
) {
  return prisma.answer.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    create: { attemptId, questionId, position, given, isCorrect, timeMs },
    update: { given, isCorrect, timeMs },
  });
}

/** Pour un QCM, affiche « B — texte de la proposition » plutôt que la seule lettre. */
function displayAnswer(
  type: QuestionType,
  value: string | null,
  choices: { label: string; text: string }[],
) {
  if (value === null) return null;
  if (type !== "QCM") return value;

  const match = choices.find((c) => c.label.toUpperCase() === value.trim().toUpperCase());
  return match ? `${match.label} — ${match.text}` : value;
}

/**
 * Réponse attendue telle qu'on la montre au candidat. Pour une question libre,
 * `correctAnswer` liste les formulations acceptées séparées par « | » : on
 * n'affiche que la première, le séparateur étant un détail de correction.
 */
function displayExpected(
  type: QuestionType,
  correctAnswer: string,
  choices: { label: string; text: string }[],
) {
  if (type !== "QCM") return correctAnswer.split("|")[0].trim();
  return displayAnswer(type, correctAnswer, choices) ?? correctAnswer;
}
