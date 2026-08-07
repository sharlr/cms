/**
 * Jeu de démonstration destiné aux captures du guide utilisateur.
 *
 * Crée des candidats variés, des participations terminées (pour que le
 * classement et les résultats ne soient pas vides) et quelques messages.
 * Rejouable : les données précédentes portant le marqueur `demo-guide` sont
 * effacées avant recréation.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";
import type { City, EducationLevel, Gender } from "../src/generated/prisma";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL manquant dans l'environnement.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

const CANDIDATES: {
  fullName: string;
  email: string;
  phone: string;
  gender: Gender;
  city: City;
  level: EducationLevel;
  correct: number;
  timeMs: number;
}[] = [
  { fullName: "Fatouma Ahmed", email: "fatouma.demo-guide@example.com", phone: "+253770001", gender: "FEMININ", city: "DJIBOUTI_VILLE", level: "LYCEE", correct: 18, timeMs: 372_000 },
  { fullName: "Ismaël Robleh", email: "ismael.demo-guide@example.com", phone: "+253770002", gender: "MASCULIN", city: "TADJOURAH", level: "UNIVERSITE", correct: 17, timeMs: 401_000 },
  { fullName: "Halima Guedi", email: "halima.demo-guide@example.com", phone: "+253770003", gender: "FEMININ", city: "ALI_SABIEH", level: "LYCEE", correct: 15, timeMs: 358_000 },
  { fullName: "Youssouf Hassan", email: "youssouf.demo-guide@example.com", phone: "+253770004", gender: "MASCULIN", city: "DIKHIL", level: "COLLEGE", correct: 13, timeMs: 425_000 },
  { fullName: "Saada Omar", email: "saada.demo-guide@example.com", phone: "+253770005", gender: "FEMININ", city: "ARTA", level: "COLLEGE", correct: 11, timeMs: 390_000 },
  { fullName: "Abdi Farah", email: "abdi.demo-guide@example.com", phone: "+253770006", gender: "MASCULIN", city: "DJIBOUTI_VILLE", level: "PRIMAIRE", correct: 9, timeMs: 445_000 },
];

/** Crée une tentative terminée avec un détail de réponses cohérent. */
async function createFinishedAttempt(
  userId: string,
  contestId: string,
  questions: { id: string; position: number; type: string; correctAnswer: string }[],
  correctTarget: number,
  totalTimeMs: number,
) {
  const perQuestion = Math.round(totalTimeMs / questions.length);

  const attempt = await prisma.attempt.create({
    data: {
      userId,
      contestId,
      status: "TERMINEE",
      currentPosition: questions.length + 1,
      startedAt: new Date(Date.now() - totalTimeMs - 60_000),
      finishedAt: new Date(Date.now() - 60_000),
      correctCount: 0,
      wrongCount: 0,
      unansweredCount: 0,
      score: 0,
      totalTimeMs: 0,
    },
  });

  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  let total = 0;

  for (const question of questions) {
    const isCorrect = correct < correctTarget;
    // Une question sur sept reste sans réponse parmi les échecs.
    const skipped = !isCorrect && question.position % 7 === 0;

    const expected = question.correctAnswer.split("|")[0].trim();
    let given: string | null;

    if (isCorrect) given = expected;
    else if (skipped) given = null;
    else given = question.type === "QCM" ? (expected === "A" ? "B" : "A") : "0";

    const timeMs = Math.max(
      1500,
      perQuestion + ((question.position * 977) % 9000) - 4500,
    );

    await prisma.answer.create({
      data: {
        attemptId: attempt.id,
        questionId: question.id,
        position: question.position,
        given,
        isCorrect,
        timeMs,
      },
    });

    if (isCorrect) correct += 1;
    else if (given === null) unanswered += 1;
    else wrong += 1;
    total += timeMs;
  }

  return prisma.attempt.update({
    where: { id: attempt.id },
    data: {
      correctCount: correct,
      wrongCount: wrong,
      unansweredCount: unanswered,
      score: correct,
      totalTimeMs: total,
    },
  });
}

async function main() {
  const contest = await prisma.contest.findUniqueOrThrow({
    where: { slug: "entrainement" },
    include: { questions: { orderBy: { position: "asc" } } },
  });

  // Nettoyage des exécutions précédentes.
  await prisma.user.deleteMany({ where: { email: { contains: "demo-guide" } } });

  const passwordHash = await bcrypt.hash("demo1234", 10);

  for (const candidate of CANDIDATES) {
    const user = await prisma.user.create({
      data: {
        fullName: candidate.fullName,
        gender: candidate.gender,
        birthDate: new Date("2007-03-12"),
        city: candidate.city,
        educationLevel: candidate.level,
        phone: candidate.phone,
        email: candidate.email,
        passwordHash,
        acceptedTerms: true,
      },
    });

    await createFinishedAttempt(
      user.id,
      contest.id,
      contest.questions,
      candidate.correct,
      candidate.timeMs,
    );
  }

  // La candidate de démonstration : une participation terminée, pour illustrer
  // les écrans de résultats, de récapitulatif et de certificat.
  const demo = await prisma.user.findUnique({
    where: { email: "candidate@example.com" },
  });

  if (demo) {
    await prisma.attempt.deleteMany({ where: { userId: demo.id } });
    await createFinishedAttempt(demo.id, contest.id, contest.questions, 16, 383_000);

    await prisma.notification.deleteMany({ where: { userId: demo.id } });
    await prisma.notification.createMany({
      data: [
        {
          userId: demo.id,
          title: "Rappel : le concours de sélection approche",
          body: "Le concours de sélection ouvrira automatiquement à l'heure officielle affichée sur votre espace. Pensez à vérifier votre connexion internet avant de commencer : une seule participation est autorisée.",
          linkUrl: "/accueil",
          createdAt: new Date(Date.now() - 2 * 86_400_000),
          readAt: new Date(Date.now() - 86_400_000),
        },
        {
          userId: demo.id,
          title: "Vos résultats d'entraînement sont disponibles",
          body: "Bravo ! Vous avez obtenu 16 bonnes réponses sur 20. Consultez le tableau récapitulatif pour revoir chacune de vos réponses.",
          linkUrl: "/historique",
          createdAt: new Date(Date.now() - 3_600_000),
        },
      ],
    });
  }

  const ranked = await prisma.attempt.count({
    where: { contestId: contest.id, status: "TERMINEE" },
  });
  console.log(`Jeu de démonstration prêt : ${CANDIDATES.length} candidats, ${ranked} participations classées.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
