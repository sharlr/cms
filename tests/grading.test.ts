import { describe, expect, it } from "vitest";
import { isAnswerCorrect, normalizeFreeAnswer, verdictFor } from "@/lib/grading";

describe("normalizeFreeAnswer", () => {
  it("ignore la casse, les accents et les espaces superflus", () => {
    expect(normalizeFreeAnswer("  Élève  ")).toBe("eleve");
    expect(normalizeFreeAnswer("DEUX")).toBe("deux");
    expect(normalizeFreeAnswer("cinq   mille")).toBe("cinq mille");
  });

  it("ignore la ponctuation", () => {
    expect(normalizeFreeAnswer("5 050.")).toBe("5 050");
    expect(normalizeFreeAnswer("(douze)")).toBe("douze");
  });
});

describe("isAnswerCorrect — QCM", () => {
  it("compare la lettre sans tenir compte de la casse", () => {
    expect(isAnswerCorrect("QCM", "c", "C")).toBe(true);
    expect(isAnswerCorrect("QCM", " C ", "C")).toBe(true);
  });

  it("refuse une autre lettre", () => {
    expect(isAnswerCorrect("QCM", "B", "C")).toBe(false);
  });

  it("compte une absence de réponse comme fausse", () => {
    expect(isAnswerCorrect("QCM", null, "C")).toBe(false);
  });
});

describe("isAnswerCorrect — réponse libre", () => {
  it("accepte chaque formulation listée", () => {
    expect(isAnswerCorrect("LIBRE", "15", "15 | quinze")).toBe(true);
    expect(isAnswerCorrect("LIBRE", "Quinze", "15 | quinze")).toBe(true);
  });

  it("accepte une réponse accentuée différemment", () => {
    expect(isAnswerCorrect("LIBRE", "SIX", "6 | six")).toBe(true);
  });

  it("refuse une réponse vide ou absente", () => {
    expect(isAnswerCorrect("LIBRE", "", "15 | quinze")).toBe(false);
    expect(isAnswerCorrect("LIBRE", "   ", "15 | quinze")).toBe(false);
    expect(isAnswerCorrect("LIBRE", null, "15 | quinze")).toBe(false);
  });

  it("refuse une réponse voisine mais différente", () => {
    expect(isAnswerCorrect("LIBRE", "16", "15 | quinze")).toBe(false);
  });

  it("ne se laisse pas piéger par un séparateur vide", () => {
    expect(isAnswerCorrect("LIBRE", "", "15 ||")).toBe(false);
  });
});

describe("verdictFor", () => {
  // Paliers du cahier des charges : plus de 75 %, de 50 à 74 %, en dessous.
  it("classe le résultat par paliers", () => {
    expect(verdictFor(20, 20).title).toBe("Excellent !");
    expect(verdictFor(16, 20).title).toBe("Excellent !");
    expect(verdictFor(13, 20).title).toBe("Bon résultat !");
    expect(verdictFor(10, 20).title).toBe("Bon résultat !");
    expect(verdictFor(9, 20).title).toBe("Continuez vos efforts.");
    expect(verdictFor(3, 20).title).toBe("Continuez vos efforts.");
  });

  it("rattache un score pile à 75 % au palier supérieur", () => {
    expect(verdictFor(15, 20).title).toBe("Excellent !");
  });

  it("expose une tonalité exploitable par l'affichage", () => {
    expect(verdictFor(20, 20).tone).toBe("excellent");
    expect(verdictFor(11, 20).tone).toBe("good");
    expect(verdictFor(2, 20).tone).toBe("keep-going");
  });

  it("ne divise pas par zéro", () => {
    expect(verdictFor(0, 0).title).toBe("Continuez vos efforts.");
  });
});
