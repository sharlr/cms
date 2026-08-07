import type { Contest } from "@/generated/prisma";

export type Availability =
  | { state: "open" }
  | { state: "scheduled"; startsAt: Date }
  | { state: "not-yet-open"; opensAt: Date }
  | { state: "closed"; closesAt: Date | null }
  | { state: "inactive" }
  | { state: "empty" };

type ContestLike = Pick<
  Contest,
  "isActive" | "startsAt" | "opensAt" | "closesAt" | "questionCount"
>;

/**
 * Disponibilité d'un concours à un instant donné.
 *
 * `startsAt` est l'heure officielle de l'épreuve : avant elle, le concours de
 * sélection reste verrouillé et l'écran affiche un compte à rebours ; le
 * bouton s'active de lui-même une fois l'heure atteinte.
 */
export function availabilityOf(contest: ContestLike, now: Date = new Date()): Availability {
  if (!contest.isActive) return { state: "inactive" };
  if (contest.questionCount === 0) return { state: "empty" };

  if (contest.closesAt && now > contest.closesAt) {
    return { state: "closed", closesAt: contest.closesAt };
  }
  if (contest.opensAt && now < contest.opensAt) {
    return { state: "not-yet-open", opensAt: contest.opensAt };
  }
  if (contest.startsAt && now < contest.startsAt) {
    return { state: "scheduled", startsAt: contest.startsAt };
  }

  return { state: "open" };
}

export function isOpen(contest: ContestLike, now: Date = new Date()) {
  return availabilityOf(contest, now).state === "open";
}

/** Message affiché au candidat quand le concours n'est pas jouable. */
export function availabilityMessage(availability: Availability): string | null {
  switch (availability.state) {
    case "open":
      return null;
    case "scheduled":
      return "L'épreuve n'a pas encore commencé.";
    case "not-yet-open":
      return "Ce concours n'est pas encore ouvert.";
    case "closed":
      return "Ce concours est clôturé.";
    case "inactive":
      return "Ce concours n'est pas ouvert.";
    case "empty":
      return "Ce concours ne comporte pas encore de questions.";
  }
}
