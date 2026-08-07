import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL manquant dans l'environnement.");
}

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

const INSTRUCTIONS = [
  "Le test comporte 20 questions.",
  "Deux types de questions peuvent être proposés : QCM avec les réponses A, B, C ou D ; questions à réponse libre (réponse à saisir).",
  "Pour les QCM, une seule réponse est correcte.",
  "Le candidat dispose de 30 secondes pour répondre à chaque question.",
  "Le candidat peut modifier sa réponse autant de fois qu'il le souhaite tant que le temps imparti n'est pas écoulé.",
  "À l'expiration des 30 secondes, la réponse sélectionnée (ou saisie) est automatiquement enregistrée.",
  "Si aucune réponse n'est fournie avant la fin du temps imparti, la question est considérée comme non répondue et est comptabilisée comme une mauvaise réponse.",
  "À la fin du temps imparti, l'application passe automatiquement à la question suivante.",
  "Une fois la question suivante affichée, il n'est plus possible de revenir en arrière ni de modifier les réponses aux questions précédentes.",
].join("\n");

type SeedQuestion = {
  type: "QCM" | "LIBRE";
  body: string;
  correctAnswer: string;
  choices?: [string, string, string, string];
};

const ENTRAINEMENT: SeedQuestion[] = [
  {
    type: "QCM",
    body: "Quel nombre complète la suite : 2, 4, 8, 16, … ?",
    choices: ["24", "30", "32", "64"],
    correctAnswer: "C",
  },
  {
    type: "LIBRE",
    body: "Quel nombre complète la suite : 3, 6, 9, 12, … ?",
    correctAnswer: "15 | quinze",
  },
  {
    type: "QCM",
    body: "Tous les chats sont des mammifères. Félix est un chat. Que peut-on conclure ?",
    choices: [
      "Félix est un reptile",
      "Félix est un mammifère",
      "Félix est un oiseau",
      "On ne peut rien conclure",
    ],
    correctAnswer: "B",
  },
  {
    type: "QCM",
    body: "Quel est l'intrus ?",
    choices: ["Lion", "Tigre", "Panthère", "Aigle"],
    correctAnswer: "D",
  },
  {
    type: "LIBRE",
    body: "Combien de minutes y a-t-il dans 3 heures et quart ?",
    correctAnswer: "195",
  },
  {
    type: "QCM",
    body: "Quel nombre complète la suite : 1, 1, 2, 3, 5, 8, … ?",
    choices: ["11", "12", "13", "15"],
    correctAnswer: "C",
  },
  {
    type: "QCM",
    body: "Si A est plus grand que B, et B plus grand que C, alors :",
    choices: ["A est plus petit que C", "A est plus grand que C", "A est égal à C", "Indéterminé"],
    correctAnswer: "B",
  },
  {
    type: "LIBRE",
    body: "Un train part à 8 h 20 et arrive à 11 h 05. Quelle est la durée du trajet, en minutes ?",
    correctAnswer: "165",
  },
  {
    type: "QCM",
    body: "Quel nombre complète la suite : 100, 81, 64, 49, … ?",
    choices: ["36", "38", "42", "25"],
    correctAnswer: "A",
  },
  {
    type: "LIBRE",
    body: "Un père a 40 ans, son fils 10 ans. Dans combien d'années le père aura-t-il exactement le double de l'âge de son fils ?",
    correctAnswer: "20",
  },
  {
    type: "QCM",
    body: "Quelle lettre complète la suite : A, C, E, G, … ?",
    choices: ["H", "I", "J", "K"],
    correctAnswer: "B",
  },
  {
    type: "QCM",
    body: "Dans une course, vous doublez le deuxième. À quelle place êtes-vous ?",
    choices: ["Premier", "Deuxième", "Troisième", "Dernier"],
    correctAnswer: "B",
  },
  {
    type: "LIBRE",
    body: "Si 5 machines fabriquent 5 pièces en 5 minutes, combien de minutes faut-il à 100 machines pour fabriquer 100 pièces ?",
    correctAnswer: "5 | cinq",
  },
  {
    type: "QCM",
    body: "Combien vaut 7 × 8 − 6 ÷ 2 ?",
    choices: ["25", "50", "53", "47"],
    correctAnswer: "C",
  },
  {
    type: "LIBRE",
    body: "Un nénuphar double de surface chaque jour et couvre tout l'étang en 48 jours. Quel jour couvre-t-il la moitié de l'étang ?",
    correctAnswer: "47",
  },
  {
    type: "QCM",
    body: "Quel est l'intrus parmi ces nombres ?",
    choices: ["2", "3", "9", "11"],
    correctAnswer: "C",
  },
  {
    type: "LIBRE",
    body: "Combien de fois le chiffre 7 apparaît-il en écrivant tous les nombres de 1 à 100 ?",
    correctAnswer: "20 | vingt",
  },
  {
    type: "QCM",
    body: "Marie est plus grande que Sophie. Sophie est plus grande que Léa. Qui est la plus petite ?",
    choices: ["Marie", "Sophie", "Léa", "Indéterminé"],
    correctAnswer: "C",
  },
  {
    type: "QCM",
    body: "Quel nombre complète la suite : 4, 9, 16, 25, … ?",
    choices: ["30", "36", "49", "81"],
    correctAnswer: "B",
  },
  {
    type: "LIBRE",
    body: "Combien d'angles droits possède un rectangle ?",
    correctAnswer: "4 | quatre",
  },
];

const SELECTION: SeedQuestion[] = [
  {
    type: "QCM",
    body: "Quel nombre complète la suite : 3, 7, 15, 31, … ?",
    choices: ["47", "55", "63", "62"],
    correctAnswer: "C",
  },
  {
    type: "LIBRE",
    body: "Dans une famille, chaque garçon a autant de frères que de sœurs, et chaque fille a deux fois plus de frères que de sœurs. Combien d'enfants compte cette famille ?",
    correctAnswer: "7 | sept",
  },
  {
    type: "QCM",
    body: "Aucun X n'est Y. Tous les Z sont des X. Que peut-on conclure ?",
    choices: ["Tous les Z sont Y", "Aucun Z n'est Y", "Certains Z sont Y", "Indéterminé"],
    correctAnswer: "B",
  },
  {
    type: "LIBRE",
    body: "Un article coûte 120 €. On applique une remise de 25 %, puis 10 % supplémentaires sur le nouveau prix. Quel est le prix final, en euros ?",
    correctAnswer: "81",
  },
  {
    type: "QCM",
    body: "Quel nombre complète la suite : 1, 4, 9, 61, 52, … ?",
    choices: ["63", "64", "46", "49"],
    correctAnswer: "A",
  },
  {
    type: "LIBRE",
    body: "Combien de diagonales possède un octogone ?",
    correctAnswer: "20 | vingt",
  },
  {
    type: "QCM",
    body: "Quelle lettre complète la suite : B, D, G, K, … ?",
    choices: ["N", "O", "P", "Q"],
    correctAnswer: "C",
  },
  {
    type: "LIBRE",
    body: "Un escargot monte de 5 mètres le jour et glisse de 3 mètres la nuit, au fond d'un puits de 15 mètres. En combien de jours sort-il du puits ?",
    correctAnswer: "6 | six",
  },
  {
    type: "QCM",
    body: "Quel nombre complète la suite : 2, 6, 12, 20, 30, … ?",
    choices: ["40", "42", "44", "36"],
    correctAnswer: "B",
  },
  {
    type: "LIBRE",
    body: "Combien de carrés, de toutes tailles, peut-on compter dans une grille de 3 × 3 cases ?",
    correctAnswer: "14 | quatorze",
  },
  {
    type: "QCM",
    body: "Tous les logiciens sont rigoureux. Certaines personnes rigoureuses sont lentes. Que peut-on conclure ?",
    choices: [
      "Certains logiciens sont lents",
      "Aucun logicien n'est lent",
      "Rien de certain",
      "Tous les logiciens sont lents",
    ],
    correctAnswer: "C",
  },
  {
    type: "LIBRE",
    body: "Quelle est la somme de tous les entiers de 1 à 100 ?",
    correctAnswer: "5050 | 5 050",
  },
  {
    type: "QCM",
    body: "Si 3 chats attrapent 3 souris en 3 minutes, combien de chats faut-il pour attraper 100 souris en 100 minutes ?",
    choices: ["3", "100", "33", "9"],
    correctAnswer: "A",
  },
  {
    type: "LIBRE",
    body: "Combien de codes à 3 chiffres tous différents peut-on former avec les chiffres 1, 2, 3, 4 et 5 ?",
    correctAnswer: "60 | soixante",
  },
  {
    type: "QCM",
    body: "Quel nombre complète la suite : 81, 27, 9, 3, … ?",
    choices: ["0", "1", "2", "3"],
    correctAnswer: "B",
  },
  {
    type: "LIBRE",
    body: "Il est 15 h 20. Quel est l'angle, en degrés, formé par la petite et la grande aiguille ?",
    correctAnswer: "20",
  },
  {
    type: "QCM",
    body: "Quel est l'intrus ?",
    choices: ["Carré", "Losange", "Rectangle", "Triangle"],
    correctAnswer: "D",
  },
  {
    type: "LIBRE",
    body: "Un panier contient trois fois plus de pommes que d'oranges, pour 48 fruits au total. Combien y a-t-il d'oranges ?",
    correctAnswer: "12 | douze",
  },
  {
    type: "QCM",
    body: "Quel nombre complète la suite : 1, 2, 6, 24, 120, … ?",
    choices: ["620", "720", "600", "840"],
    correctAnswer: "B",
  },
  {
    type: "LIBRE",
    body: "En 12 heures, combien de fois les deux aiguilles d'une montre se superposent-elles exactement ?",
    correctAnswer: "11 | onze",
  },
];

const LABELS = ["A", "B", "C", "D"] as const;

async function seedContest(
  slug: string,
  title: string,
  mode: "ENTRAINEMENT" | "SELECTION",
  information: string | null,
  questions: SeedQuestion[],
  extra: { edition?: number; startsAt?: Date } = {},
) {
  await prisma.contest.deleteMany({ where: { slug } });

  const contest = await prisma.contest.create({
    data: {
      slug,
      title,
      mode,
      information,
      instructions: INSTRUCTIONS,
      questionCount: questions.length,
      secondsPerQuestion: 30,
      isActive: true,
      edition: extra.edition ?? new Date().getFullYear(),
      startsAt: extra.startsAt ?? null,
    },
  });

  for (const [index, q] of questions.entries()) {
    await prisma.question.create({
      data: {
        contestId: contest.id,
        position: index + 1,
        type: q.type,
        body: q.body,
        correctAnswer: q.correctAnswer,
        choices: q.choices
          ? { create: q.choices.map((text, i) => ({ label: LABELS[i], text })) }
          : undefined,
      },
    });
  }

  console.log(`  ${title} : ${questions.length} questions`);
}

const REGLEMENT = `Le Concours National de Logique est ouvert à tous les élèves et étudiants résidant à Djibouti, du niveau primaire au niveau universitaire.

Article 1 — Inscription
- L'inscription est gratuite et obligatoire pour participer.
- Un seul compte est autorisé par candidat. Toute inscription multiple entraîne la disqualification.
- Les informations fournies à l'inscription doivent être exactes et vérifiables.

Article 2 — Déroulement de l'épreuve
- L'épreuve comporte 20 questions présentées une par une.
- Deux types de questions sont proposés : questions à choix multiples (A, B, C ou D) et questions à réponse libre.
- Le candidat dispose de 30 secondes par question.
- À l'expiration du temps imparti, la réponse en cours est enregistrée automatiquement et la question suivante s'affiche.
- Toute question non répondue est comptabilisée comme une mauvaise réponse.
- Le retour aux questions précédentes est impossible.

Article 3 — Classement
- Les candidats sont classés selon leur nombre de bonnes réponses, par ordre décroissant.
- En cas d'égalité, le temps total de réponse le plus faible départage les candidats.

Article 4 — Récompenses
- Tous les candidats sélectionnés reçoivent une récompense et un certificat de participation signé par l'association.
- La nature des prix est arrêtée chaque année avec les partenaires du concours.

Article 5 — Fraude
- Toute tentative de fraude entraîne l'exclusion immédiate du concours.
- L'association se réserve le droit de vérifier l'identité des candidats sélectionnés.`;

const CONTACT = `L'association organisatrice du Concours National de Logique reste à votre disposition.

- Adresse e-mail : contact@concourslogique.org
- Téléphone : +253 21 00 00 00
- Adresse : Djibouti-ville, République de Djibouti

Horaires
- Du dimanche au jeudi, de 8h00 à 15h00.

Pour toute question relative à une inscription, précisez votre nom complet et l'adresse e-mail utilisée lors de la création de votre compte.`;

const RECOMPENSES = `Les prix et cadeaux du Concours National de Logique sont définis chaque année avec les partenaires institutionnels, académiques et financiers de l'association.

Ce qui est garanti à chaque édition
- Tous les participants sélectionnés reçoivent une récompense.
- Tous les participants sélectionnés reçoivent un certificat de participation signé par l'association.
- Les lauréats sont mis à l'honneur lors de la cérémonie nationale de remise des prix.

La liste détaillée des lots de l'édition en cours est publiée dans l'onglet Actualités dès qu'elle est arrêtée avec les partenaires.`;

async function seedEditorialContent() {
  const pages = [
    { slug: "reglement", title: "Règlement du concours", body: REGLEMENT },
    { slug: "contact", title: "Contact de l'association", body: CONTACT },
    { slug: "recompenses", title: "Récompenses", body: RECOMPENSES },
  ];

  for (const page of pages) {
    await prisma.sitePage.upsert({
      where: { slug: page.slug },
      update: { title: page.title, body: page.body },
      create: page,
    });
  }
  console.log(`  ${pages.length} pages éditoriales`);

  const partners = [
    { name: "Women in STEM", position: 1 },
    { name: "Présidence de la République", position: 2 },
    { name: "Ministère de l'Éducation nationale", position: 3 },
    { name: "Université de Djibouti", position: 4 },
  ];

  await prisma.partner.deleteMany();
  await prisma.partner.createMany({ data: partners });
  console.log(`  ${partners.length} partenaires`);

  const now = Date.now();
  const news = [
    {
      title: "Ouverture des inscriptions à l'édition 2026",
      body: "Les inscriptions au Concours National de Logique sont ouvertes. Créez votre compte pour accéder à l'entraînement et réserver votre place au concours de sélection. L'inscription est gratuite et ne prend que quelques minutes.",
      isPinned: true,
      publishedAt: new Date(now - 6 * 86400000),
    },
    {
      title: "Date officielle du concours de sélection",
      body: "Le concours de sélection se tiendra en ligne à la date annoncée sur votre espace candidat. Le bouton d'accès s'activera automatiquement à l'heure officielle : aucune inscription de dernière minute ne sera possible ce jour-là.",
      isPinned: false,
      publishedAt: new Date(now - 3 * 86400000),
    },
    {
      title: "Nouvelles séries d'entraînement disponibles",
      body: "De nouvelles séries de 20 questions viennent d'être ajoutées au mode entraînement. Elles reprennent les types de questions posés lors des éditions précédentes : suites logiques, raisonnement déductif, intrus et calcul mental.",
      isPinned: false,
      publishedAt: new Date(now - 86400000),
    },
  ];

  await prisma.news.deleteMany();
  await prisma.news.createMany({ data: news });
  console.log(`  ${news.length} actualités`);
}

async function main() {
  console.log("Initialisation des données…");

  const year = new Date().getFullYear();

  await seedContest("entrainement", "Entrainement", "ENTRAINEMENT", null, ENTRAINEMENT, {
    edition: year,
  });

  // Épreuve programmée dans une semaine : l'accueil affiche le compte à rebours
  // et le bouton s'activera de lui-même à l'heure dite.
  await seedContest(
    "selection",
    "Concours de sélection",
    "SELECTION",
    "Le concours de sélection se déroule en une seule session. Assurez-vous d'avoir une connexion stable avant de commencer : une seule participation est autorisée.",
    SELECTION,
    { edition: year, startsAt: new Date(Date.now() + 7 * 86400000) },
  );

  await seedEditorialContent();

  const adminEmail = "administrator@cms.local";
  const adminPassword = "123*123A";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      fullName: "Administrator",
      gender: "MASCULIN",
      birthDate: new Date("1980-01-01"),
      city: "DJIBOUTI_VILLE",
      educationLevel: "UNIVERSITE",
      phone: "+22200000001",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      acceptedTerms: true,
      role: "ADMIN",
    },
  });
  console.log(`  Compte administrateur : ${adminEmail} / ${adminPassword}`);

  const demoEmail = "candidate@example.com";
  await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      fullName: "Awa Diallo",
      gender: "FEMININ",
      birthDate: new Date("2006-05-14"),
      city: "DJIBOUTI_VILLE",
      educationLevel: "LYCEE",
      phone: "+22211111111",
      email: demoEmail,
      passwordHash: await bcrypt.hash("demo1234", 10),
      acceptedTerms: true,
    },
  });
  console.log(`  Compte de démonstration : ${demoEmail} / demo1234`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
