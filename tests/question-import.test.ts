import { describe, expect, it } from "vitest";
import { ExcelJS } from "@/lib/excel";
import { parseQuestionWorkbook } from "@/lib/question-import";

type Row = (string | number | null)[];

/** Construit un classeur en mémoire et le rend sous forme d'ArrayBuffer. */
async function workbookFrom(rows: Row[]): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Questions");

  sheet.addRow([
    "Type",
    "Énoncé",
    "Réponse A",
    "Réponse B",
    "Réponse C",
    "Réponse D",
    "Bonne réponse",
    "Points",
  ]);
  for (const row of rows) sheet.addRow(row);

  return (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
}

const QCM: Row = ["QCM", "Quel est l'intrus ?", "Chat", "Chien", "Table", "Cheval", "C", 1];
const LIBRE: Row = ["LIBRE", "Combien font 7 × 3 ?", null, null, null, null, "21 | vingt-et-un", 2];

describe("parseQuestionWorkbook", () => {
  it("lit un QCM et une question libre", async () => {
    const { questions, errors } = await parseQuestionWorkbook(await workbookFrom([QCM, LIBRE]));

    expect(errors).toEqual([]);
    expect(questions).toHaveLength(2);

    expect(questions[0]).toMatchObject({
      type: "QCM",
      body: "Quel est l'intrus ?",
      correctAnswer: "C",
      points: 1,
    });
    expect(questions[0].choices.map((c) => c.label)).toEqual(["A", "B", "C", "D"]);

    expect(questions[1]).toMatchObject({
      type: "LIBRE",
      correctAnswer: "21 | vingt-et-un",
      points: 2,
      choices: [],
    });
  });

  it("accepte les intitulés de type courants et la casse", async () => {
    const { questions, errors } = await parseQuestionWorkbook(
      await workbookFrom([
        ["qcm", "Une question à choix ?", "A", "B", "C", "D", "b", 1],
        ["Texte", "Une question ouverte ?", null, null, null, null, "réponse", 1],
      ]),
    );

    expect(errors).toEqual([]);
    expect(questions[0].correctAnswer).toBe("B");
    expect(questions[1].type).toBe("LIBRE");
  });

  it("ignore les lignes entièrement vides", async () => {
    const { questions, errors } = await parseQuestionWorkbook(
      await workbookFrom([QCM, [null, null, null, null, null, null, null, null], LIBRE]),
    );

    expect(errors).toEqual([]);
    expect(questions).toHaveLength(2);
  });

  it("signale un type inconnu", async () => {
    const { errors } = await parseQuestionWorkbook(
      await workbookFrom([["VRAI-FAUX", "Une question ?", "A", "B", "C", "D", "A", 1]]),
    );

    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/Ligne 2/);
    expect(errors[0]).toMatch(/type/i);
  });

  it("signale une proposition manquante sur un QCM", async () => {
    const { errors, questions } = await parseQuestionWorkbook(
      await workbookFrom([["QCM", "Quel est l'intrus ?", "Chat", "", "Table", "Cheval", "C", 1]]),
    );

    expect(questions).toHaveLength(0);
    expect(errors[0]).toMatch(/proposition/i);
  });

  it("signale une lettre de bonne réponse invalide", async () => {
    const { errors } = await parseQuestionWorkbook(
      await workbookFrom([["QCM", "Quel est l'intrus ?", "A", "B", "C", "D", "E", 1]]),
    );

    expect(errors[0]).toMatch(/bonne réponse/i);
  });

  it("signale une réponse attendue manquante en question libre", async () => {
    const { errors } = await parseQuestionWorkbook(
      await workbookFrom([["LIBRE", "Une question ouverte ?", null, null, null, null, "", 1]]),
    );

    expect(errors[0]).toMatch(/réponse attendue/i);
  });

  it("signale un énoncé trop court", async () => {
    const { errors } = await parseQuestionWorkbook(
      await workbookFrom([["QCM", "Ok", "A", "B", "C", "D", "A", 1]]),
    );

    expect(errors[0]).toMatch(/énoncé/i);
  });

  it("retombe sur 1 point quand la colonne est vide ou aberrante", async () => {
    const { questions } = await parseQuestionWorkbook(
      await workbookFrom([
        ["QCM", "Quel est l'intrus ?", "A", "B", "C", "D", "A", null],
        ["QCM", "Quel est le suivant ?", "A", "B", "C", "D", "A", -5],
      ]),
    );

    expect(questions[0].points).toBe(1);
    expect(questions[1].points).toBe(1);
  });
});
