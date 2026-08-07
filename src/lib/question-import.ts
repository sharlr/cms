import { ExcelJS } from "@/lib/excel";
import type { QuestionType } from "@/generated/prisma";

/**
 * Import de questions depuis un classeur Excel.
 *
 * Colonnes attendues sur la première feuille, en-tête en ligne 1 :
 *   Type | Énoncé | Réponse A | Réponse B | Réponse C | Réponse D | Bonne réponse | Points
 *
 * - `Type` vaut « QCM » ou « LIBRE » (« libre », « texte », « saisie » acceptés).
 * - Pour un QCM, `Bonne réponse` est la lettre A–D et les quatre propositions
 *   sont obligatoires.
 * - Pour une question libre, `Bonne réponse` contient les formulations
 *   acceptées séparées par « | » ; les colonnes A–D sont ignorées.
 */
export type ParsedQuestion = {
  type: QuestionType;
  body: string;
  correctAnswer: string;
  points: number;
  choices: { label: string; text: string }[];
};

export type ImportReport = {
  questions: ParsedQuestion[];
  errors: string[];
};

const LABELS = ["A", "B", "C", "D"] as const;

function cellText(row: ExcelJS.Row, column: number): string {
  const value = row.getCell(column).value;
  if (value === null || value === undefined) return "";

  // Une cellule peut porter du texte enrichi ou une formule : on ne garde que
  // le texte rendu, jamais l'objet brut.
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("").trim();
    }
    if ("result" in value) return String(value.result ?? "").trim();
    if ("text" in value) return String(value.text ?? "").trim();
    return "";
  }

  return String(value).trim();
}

export async function parseQuestionWorkbook(data: ArrayBuffer): Promise<ImportReport> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data);

  const sheet = workbook.worksheets[0];
  const errors: string[] = [];
  const questions: ParsedQuestion[] = [];

  if (!sheet) {
    return { questions, errors: ["Le fichier ne contient aucune feuille."] };
  }

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // en-tête

    const rawType = cellText(row, 1).toUpperCase();
    const body = cellText(row, 2);
    const correctRaw = cellText(row, 7);
    const pointsRaw = cellText(row, 8);

    // Ligne entièrement vide : fin de tableau, pas une erreur.
    if (!rawType && !body && !correctRaw) return;

    const isFree = ["LIBRE", "TEXTE", "SAISIE", "REPONSE LIBRE"].includes(rawType);
    const isQcm = ["QCM", "CHOIX MULTIPLE", "CHOIX MULTIPLES"].includes(rawType);

    if (!isFree && !isQcm) {
      errors.push(`Ligne ${rowNumber} : type « ${rawType || "vide"} » inconnu (QCM ou LIBRE).`);
      return;
    }
    if (body.length < 5) {
      errors.push(`Ligne ${rowNumber} : énoncé manquant ou trop court.`);
      return;
    }

    const points = Number(pointsRaw);
    const safePoints = Number.isFinite(points) && points >= 1 ? Math.floor(points) : 1;

    if (isQcm) {
      const texts = LABELS.map((_, index) => cellText(row, 3 + index));
      const missing = LABELS.filter((_, index) => texts[index] === "");
      if (missing.length > 0) {
        errors.push(
          `Ligne ${rowNumber} : proposition(s) ${missing.join(", ")} manquante(s).`,
        );
        return;
      }

      const letter = correctRaw.toUpperCase();
      if (!LABELS.includes(letter as (typeof LABELS)[number])) {
        errors.push(`Ligne ${rowNumber} : bonne réponse « ${correctRaw} » invalide (A, B, C ou D).`);
        return;
      }

      questions.push({
        type: "QCM",
        body,
        correctAnswer: letter,
        points: safePoints,
        choices: LABELS.map((label, index) => ({ label, text: texts[index] })),
      });
      return;
    }

    if (correctRaw === "") {
      errors.push(`Ligne ${rowNumber} : réponse attendue manquante.`);
      return;
    }

    questions.push({
      type: "LIBRE",
      body,
      correctAnswer: correctRaw,
      points: safePoints,
      choices: [],
    });
  });

  return { questions, errors };
}

/** Classeur modèle proposé au téléchargement dans l'écran d'import. */
export function buildImportTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Concours National de Logique";

  const sheet = workbook.addWorksheet("Questions");
  sheet.columns = [
    { header: "Type", key: "type", width: 10 },
    { header: "Énoncé", key: "body", width: 60 },
    { header: "Réponse A", key: "a", width: 22 },
    { header: "Réponse B", key: "b", width: 22 },
    { header: "Réponse C", key: "c", width: 22 },
    { header: "Réponse D", key: "d", width: 22 },
    { header: "Bonne réponse", key: "correct", width: 18 },
    { header: "Points", key: "points", width: 9 },
  ];

  sheet.addRow({
    type: "QCM",
    body: "Quel nombre complète la suite : 2, 4, 8, 16, … ?",
    a: "24",
    b: "30",
    c: "32",
    d: "18",
    correct: "C",
    points: 1,
  });
  sheet.addRow({
    type: "LIBRE",
    body: "Quel nombre complète la suite : 3, 6, 9, 12, … ?",
    correct: "15 | quinze",
    points: 1,
  });

  return { workbook, sheet };
}
