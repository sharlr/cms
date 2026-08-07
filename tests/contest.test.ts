import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  getAttemptResults,
  serveCurrentQuestion,
  startAttempt,
  submitAnswer,
} from "@/lib/contest";
import { getAnswers, getAttempt, makeContest, makeUser, rewindClock } from "./helpers";

afterAll(() => prisma.$disconnect());

describe("startAttempt", () => {
  it("crée une tentative puis reprend celle en cours", async () => {
    const user = await makeUser();
    const contest = await makeContest();

    const first = await startAttempt(user.id, contest.slug);
    const second = await startAttempt(user.id, contest.slug);

    expect(second.id).toBe(first.id);
    expect(first.currentPosition).toBe(1);
  });

  it("n'autorise qu'une participation au concours de sélection", async () => {
    const user = await makeUser();
    const contest = await makeContest({ mode: "SELECTION", questionCount: 1 });

    const attempt = await startAttempt(user.id, contest.slug);
    await serveCurrentQuestion(attempt.id, user.id);
    await submitAnswer(attempt.id, user.id, 1, "B");

    await expect(startAttempt(user.id, contest.slug)).rejects.toThrow(
      /une seule participation/i,
    );
  });

  it("laisse l'entrainement être rejoué", async () => {
    const user = await makeUser();
    const contest = await makeContest({ questionCount: 1 });

    const first = await startAttempt(user.id, contest.slug);
    await serveCurrentQuestion(first.id, user.id);
    await submitAnswer(first.id, user.id, 1, "B");

    const second = await startAttempt(user.id, contest.slug);
    expect(second.id).not.toBe(first.id);
  });

  it("refuse un concours fermé", async () => {
    const user = await makeUser();
    const contest = await makeContest();
    await prisma.contest.update({
      where: { id: contest.id },
      data: { closesAt: new Date(Date.now() - 1000) },
    });

    await expect(startAttempt(user.id, contest.slug)).rejects.toThrow(/clôturé/i);
  });
});

describe("serveCurrentQuestion — armement du chrono", () => {
  it("n'arme pas le chrono quand startClock est faux", async () => {
    const user = await makeUser();
    const contest = await makeContest();
    const attempt = await startAttempt(user.id, contest.slug);

    const served = await serveCurrentQuestion(attempt.id, user.id, { startClock: false });

    expect(served.kind).toBe("question");
    if (served.kind !== "question") return;
    expect(served.remainingMs).toBe(30_000);
    // Rien n'est persisté : le décompte n'a pas commencé côté serveur.
    expect((await getAttempt(attempt.id)).questionServedAt).toBeNull();
  });

  it("arme le chrono au premier service réel", async () => {
    const user = await makeUser();
    const contest = await makeContest();
    const attempt = await startAttempt(user.id, contest.slug);

    await serveCurrentQuestion(attempt.id, user.id);

    expect((await getAttempt(attempt.id)).questionServedAt).toBeInstanceOf(Date);
  });

  it("ne redémarre pas le chrono si la question est rechargée", async () => {
    const user = await makeUser();
    const contest = await makeContest();
    const attempt = await startAttempt(user.id, contest.slug);

    await serveCurrentQuestion(attempt.id, user.id);
    await rewindClock(attempt.id, 20_000);
    const again = await serveCurrentQuestion(attempt.id, user.id);

    expect(again.kind).toBe("question");
    if (again.kind !== "question") return;
    expect(again.remainingMs).toBeLessThanOrEqual(10_000);
    expect(again.remainingMs).toBeGreaterThan(8_000);
  });

  it("expose les propositions d'un QCM et rien pour une question libre", async () => {
    const user = await makeUser();
    const contest = await makeContest();
    const attempt = await startAttempt(user.id, contest.slug);

    const qcm = await serveCurrentQuestion(attempt.id, user.id);
    expect(qcm.kind === "question" && qcm.choices.map((c) => c.label)).toEqual([
      "A",
      "B",
      "C",
      "D",
    ]);

    await submitAnswer(attempt.id, user.id, 1, "B");
    const libre = await serveCurrentQuestion(attempt.id, user.id);
    expect(libre.kind === "question" && libre.type).toBe("LIBRE");
    expect(libre.kind === "question" && libre.choices).toEqual([]);
  });
});

describe("submitAnswer", () => {
  it("corrige un QCM et avance d'une question", async () => {
    const user = await makeUser();
    const contest = await makeContest();
    const attempt = await startAttempt(user.id, contest.slug);
    await serveCurrentQuestion(attempt.id, user.id);

    const next = await submitAnswer(attempt.id, user.id, 1, "B");

    expect(next.kind === "question" && next.position).toBe(2);
    const [answer] = await getAnswers(attempt.id);
    expect(answer.given).toBe("B");
    expect(answer.isCorrect).toBe(true);
  });

  it("accepte une formulation alternative en réponse libre", async () => {
    const user = await makeUser();
    const contest = await makeContest();
    const attempt = await startAttempt(user.id, contest.slug);
    await serveCurrentQuestion(attempt.id, user.id);
    await submitAnswer(attempt.id, user.id, 1, "A");
    await serveCurrentQuestion(attempt.id, user.id);

    await submitAnswer(attempt.id, user.id, 2, "Douze");

    const answers = await getAnswers(attempt.id);
    expect(answers[1].isCorrect).toBe(true);
  });

  it("traite une chaîne vide comme une absence de réponse", async () => {
    const user = await makeUser();
    const contest = await makeContest();
    const attempt = await startAttempt(user.id, contest.slug);
    await serveCurrentQuestion(attempt.id, user.id);

    await submitAnswer(attempt.id, user.id, 1, "   ");

    const [answer] = await getAnswers(attempt.id);
    expect(answer.given).toBeNull();
    expect(answer.isCorrect).toBe(false);
  });

  it("rejette une réponse arrivée après le temps imparti et la tolérance", async () => {
    const user = await makeUser();
    const contest = await makeContest();
    const attempt = await startAttempt(user.id, contest.slug);
    await serveCurrentQuestion(attempt.id, user.id);
    // 30 s de limite + 2 s de tolérance : à 40 s, la réponse est hors délai.
    await rewindClock(attempt.id, 40_000);

    await submitAnswer(attempt.id, user.id, 1, "B");

    const [answer] = await getAnswers(attempt.id);
    expect(answer.given).toBeNull();
    expect(answer.isCorrect).toBe(false);
  });

  it("accepte une réponse arrivée dans la tolérance réseau", async () => {
    const user = await makeUser();
    const contest = await makeContest();
    const attempt = await startAttempt(user.id, contest.slug);
    await serveCurrentQuestion(attempt.id, user.id);
    // 31 s : le chrono est écoulé mais la réponse est partie à temps.
    await rewindClock(attempt.id, 31_000);

    await submitAnswer(attempt.id, user.id, 1, "B");

    const [answer] = await getAnswers(attempt.id);
    expect(answer.given).toBe("B");
    expect(answer.isCorrect).toBe(true);
  });

  it("interdit de revenir sur une question déjà validée", async () => {
    const user = await makeUser();
    const contest = await makeContest();
    const attempt = await startAttempt(user.id, contest.slug);
    await serveCurrentQuestion(attempt.id, user.id);
    await submitAnswer(attempt.id, user.id, 1, "B");

    // Nouvelle tentative de réponse sur la question 1, déjà dépassée.
    const result = await submitAnswer(attempt.id, user.id, 1, "A");

    expect(result.kind === "question" && result.position).toBe(2);
    const [first] = await getAnswers(attempt.id);
    expect(first.given).toBe("B");
    expect(first.isCorrect).toBe(true);
  });

  it("refuse la tentative d'un autre candidat", async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const contest = await makeContest();
    const attempt = await startAttempt(owner.id, contest.slug);

    await expect(submitAnswer(attempt.id, intruder.id, 1, "B")).rejects.toThrow(
      /introuvable/i,
    );
  });
});

describe("reprise après abandon", () => {
  it("marque non répondues les questions expirées pendant l'absence", async () => {
    const user = await makeUser();
    const contest = await makeContest({ questionCount: 3 });
    const attempt = await startAttempt(user.id, contest.slug);
    await serveCurrentQuestion(attempt.id, user.id);

    // Le candidat ferme l'application pendant une minute.
    await rewindClock(attempt.id, 60_000);
    const resumed = await serveCurrentQuestion(attempt.id, user.id);

    expect(resumed.kind === "question" && resumed.position).toBe(2);
    const answers = await getAnswers(attempt.id);
    expect(answers).toHaveLength(1);
    expect(answers[0].given).toBeNull();
    expect(answers[0].timeMs).toBe(30_000);
  });

  it("clôture la tentative si tout le temps s'est écoulé sur la dernière question", async () => {
    const user = await makeUser();
    const contest = await makeContest({ questionCount: 1 });
    const attempt = await startAttempt(user.id, contest.slug);
    await serveCurrentQuestion(attempt.id, user.id);
    await rewindClock(attempt.id, 60_000);

    const resumed = await serveCurrentQuestion(attempt.id, user.id);

    expect(resumed.kind).toBe("finished");
    expect((await getAttempt(attempt.id)).status).toBe("TERMINEE");
  });
});

describe("clôture et résultats", () => {
  it("agrège les compteurs à la fin de l'épreuve", async () => {
    const user = await makeUser();
    const contest = await makeContest({ questionCount: 4 });
    const attempt = await startAttempt(user.id, contest.slug);

    await serveCurrentQuestion(attempt.id, user.id);
    await submitAnswer(attempt.id, user.id, 1, "B"); // QCM correct
    await submitAnswer(attempt.id, user.id, 2, "999"); // libre faux
    await submitAnswer(attempt.id, user.id, 3, null); // non répondue
    const end = await submitAnswer(attempt.id, user.id, 4, "douze"); // libre correct

    expect(end.kind).toBe("finished");
    const finished = await getAttempt(attempt.id);
    expect(finished.status).toBe("TERMINEE");
    expect(finished.correctCount).toBe(2);
    expect(finished.wrongCount).toBe(1);
    expect(finished.unansweredCount).toBe(1);
    expect(finished.score).toBe(2);
    expect(finished.finishedAt).toBeInstanceOf(Date);
  });

  it("présente la réponse attendue sans le séparateur des variantes", async () => {
    const user = await makeUser();
    const contest = await makeContest({ questionCount: 2 });
    const attempt = await startAttempt(user.id, contest.slug);
    await serveCurrentQuestion(attempt.id, user.id);
    await submitAnswer(attempt.id, user.id, 1, "A");
    await submitAnswer(attempt.id, user.id, 2, "douze");

    const results = await getAttemptResults(attempt.id, user.id);

    expect(results).not.toBeNull();
    expect(results!.rows[0].expected).toBe("B — Proposition B");
    expect(results!.rows[0].given).toBe("A — Proposition A");
    expect(results!.rows[1].expected).toBe("12");
    expect(results!.total).toBe(2);
    expect(results!.verdict.title).toBe("Bon résultat !");
  });

  it("ne rend pas les résultats d'un autre candidat", async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const contest = await makeContest({ questionCount: 1 });
    const attempt = await startAttempt(owner.id, contest.slug);
    await serveCurrentQuestion(attempt.id, owner.id);
    await submitAnswer(attempt.id, owner.id, 1, "B");

    expect(await getAttemptResults(attempt.id, intruder.id)).toBeNull();
  });
});
