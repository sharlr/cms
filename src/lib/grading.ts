/** Normalisation d'une réponse libre : casse, accents, ponctuation et espaces ignorés. */
export function normalizeFreeAnswer(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.,;:!?'"()[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Compare la réponse du candidat à la réponse attendue.
 * Pour une question libre, `correctAnswer` peut lister plusieurs formulations
 * acceptées séparées par « | » (ex. « 12 | douze »).
 */
export function isAnswerCorrect(
  type: "QCM" | "LIBRE",
  given: string | null,
  correctAnswer: string,
): boolean {
  if (given === null) return false;

  if (type === "QCM") {
    return given.trim().toUpperCase() === correctAnswer.trim().toUpperCase();
  }

  const candidate = normalizeFreeAnswer(given);
  if (candidate === "") return false;

  return correctAnswer
    .split("|")
    .map(normalizeFreeAnswer)
    .some((accepted) => accepted !== "" && accepted === candidate);
}

export type VerdictTone = "excellent" | "good" | "keep-going";
export type Verdict = { title: string; message: string; tone: VerdictTone };

/**
 * Message de résultat, aux seuils du cahier des charges : plus de 75 % de
 * bonnes réponses, de 50 à 74 %, et en dessous.
 *
 * Le cahier des charges laisse 75 % lui-même entre deux paliers (« plus de
 * 75 % » puis « 50 à 74 % ») : un score pile à 75 % est rattaché au palier
 * supérieur.
 */
export function verdictFor(correct: number, total: number): Verdict {
  const ratio = total === 0 ? 0 : correct / total;

  if (ratio >= 0.75) {
    return {
      title: "Excellent !",
      message:
        "Vous avez un très bon sens de la logique. Continuez à vous entraîner pour le concours.",
      tone: "excellent",
    };
  }
  if (ratio >= 0.5) {
    return {
      title: "Bon résultat !",
      message: "Continuez à vous entraîner afin d'améliorer votre score.",
      tone: "good",
    };
  }
  return {
    title: "Continuez vos efforts.",
    message: "Chaque entraînement vous permettra de progresser.",
    tone: "keep-going",
  };
}
