import { prisma } from "@/lib/prisma";
import type { ContestMode } from "@/generated/prisma";

/**
 * Suffixe unique des données de test.
 *
 * Vitest isole les modules par fichier : un simple compteur repartirait de zéro
 * dans chaque suite et heurterait les contraintes d'unicité de la base, qui est
 * partagée. On combine donc le compteur local à un jeton tiré au démarrage du
 * module.
 */
const RUN = Math.random().toString(36).slice(2, 8);
let counter = 0;

function uid() {
  counter += 1;
  return `${RUN}-${counter}`;
}

/** Utilisateur jetable, propre à un test. */
export async function makeUser() {
  const id = uid();
  return prisma.user.create({
    data: {
      fullName: `Candidate ${id}`,
      gender: "FEMININ",
      birthDate: new Date("2006-01-01"),
      city: "DJIBOUTI_VILLE",
      educationLevel: "LYCEE",
      phone: `+222-${id}`,
      email: `candidate-${id}@test.local`,
      passwordHash: "hash-non-utilise",
      acceptedTerms: true,
    },
  });
}

/**
 * Concours jetable : une question QCM (bonne réponse « B ») suivie d'une
 * question libre (« 12 » ou « douze »), sauf indication contraire.
 */
export async function makeContest({
  mode = "ENTRAINEMENT" as ContestMode,
  secondsPerQuestion = 30,
  questionCount = 2,
} = {}) {
  const id = uid();
  const contest = await prisma.contest.create({
    data: {
      slug: `concours-test-${id}`,
      title: `Concours de test ${id}`,
      mode,
      instructions: "Consignes de test.",
      questionCount,
      secondsPerQuestion,
    },
  });

  for (let position = 1; position <= questionCount; position += 1) {
    const isQcm = position % 2 === 1;
    await prisma.question.create({
      data: {
        contestId: contest.id,
        position,
        type: isQcm ? "QCM" : "LIBRE",
        body: `Question ${position} ?`,
        correctAnswer: isQcm ? "B" : "12 | douze",
        choices: isQcm
          ? {
              create: [
                { label: "A", text: "Proposition A" },
                { label: "B", text: "Proposition B" },
                { label: "C", text: "Proposition C" },
                { label: "D", text: "Proposition D" },
              ],
            }
          : undefined,
      },
    });
  }

  return contest;
}

/**
 * Recule artificiellement l'instant où la question courante a été servie,
 * pour simuler l'écoulement du chrono sans attendre réellement.
 */
export function rewindClock(attemptId: string, milliseconds: number) {
  return prisma.attempt.update({
    where: { id: attemptId },
    data: { questionServedAt: new Date(Date.now() - milliseconds) },
  });
}

export function getAttempt(attemptId: string) {
  return prisma.attempt.findUniqueOrThrow({ where: { id: attemptId } });
}

export function getAnswers(attemptId: string) {
  return prisma.answer.findMany({
    where: { attemptId },
    orderBy: { position: "asc" },
  });
}
