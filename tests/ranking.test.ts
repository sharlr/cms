import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getRanking, getUserRank } from "@/lib/ranking";
import { makeContest, makeUser } from "./helpers";

afterAll(() => prisma.$disconnect());

/** Tentative terminée écrite directement, pour piloter score et temps. */
async function finishAttempt(
  contestId: string,
  userId: string,
  correctCount: number,
  totalTimeMs: number,
) {
  return prisma.attempt.create({
    data: {
      userId,
      contestId,
      status: "TERMINEE",
      finishedAt: new Date(),
      correctCount,
      wrongCount: 20 - correctCount,
      unansweredCount: 0,
      score: correctCount,
      totalTimeMs,
    },
  });
}

describe("getRanking", () => {
  it("classe par bonnes réponses décroissantes", async () => {
    const contest = await makeContest();
    const [a, b, c] = await Promise.all([makeUser(), makeUser(), makeUser()]);

    await finishAttempt(contest.id, a.id, 12, 300_000);
    await finishAttempt(contest.id, b.id, 18, 400_000);
    await finishAttempt(contest.id, c.id, 15, 200_000);

    const ranking = await getRanking(contest.id);

    expect(ranking.map((r) => r.userId)).toEqual([b.id, c.id, a.id]);
    expect(ranking.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("départage une égalité par le temps total le plus faible", async () => {
    const contest = await makeContest();
    const [slow, fast] = await Promise.all([makeUser(), makeUser()]);

    await finishAttempt(contest.id, slow.id, 15, 500_000);
    await finishAttempt(contest.id, fast.id, 15, 250_000);

    const ranking = await getRanking(contest.id);

    expect(ranking[0].userId).toBe(fast.id);
    expect(ranking[1].userId).toBe(slow.id);
  });

  it("partage le rang en cas d'égalité stricte et saute le suivant", async () => {
    const contest = await makeContest();
    const [a, b, c] = await Promise.all([makeUser(), makeUser(), makeUser()]);

    await finishAttempt(contest.id, a.id, 15, 300_000);
    await finishAttempt(contest.id, b.id, 15, 300_000);
    await finishAttempt(contest.id, c.id, 10, 200_000);

    const ranking = await getRanking(contest.id);

    expect(ranking.map((r) => r.rank)).toEqual([1, 1, 3]);
  });

  it("ne retient que la meilleure tentative d'un même candidat", async () => {
    const contest = await makeContest();
    const user = await makeUser();

    await finishAttempt(contest.id, user.id, 8, 200_000);
    await finishAttempt(contest.id, user.id, 17, 400_000);
    await finishAttempt(contest.id, user.id, 12, 100_000);

    const ranking = await getRanking(contest.id);

    expect(ranking).toHaveLength(1);
    expect(ranking[0].correctCount).toBe(17);
  });

  it("ignore les tentatives en cours", async () => {
    const contest = await makeContest();
    const [done, running] = await Promise.all([makeUser(), makeUser()]);

    await finishAttempt(contest.id, done.id, 11, 300_000);
    await prisma.attempt.create({ data: { userId: running.id, contestId: contest.id } });

    const ranking = await getRanking(contest.id);

    expect(ranking).toHaveLength(1);
    expect(ranking[0].userId).toBe(done.id);
  });
});

describe("getUserRank", () => {
  it("renvoie le rang du candidat et l'effectif classé", async () => {
    const contest = await makeContest();
    const [a, b] = await Promise.all([makeUser(), makeUser()]);

    await finishAttempt(contest.id, a.id, 9, 300_000);
    await finishAttempt(contest.id, b.id, 19, 300_000);

    expect(await getUserRank(contest.id, a.id)).toEqual({ rank: 2, total: 2 });
    expect(await getUserRank(contest.id, b.id)).toEqual({ rank: 1, total: 2 });
  });

  it("renvoie null pour un candidat absent du classement", async () => {
    const contest = await makeContest();
    const outsider = await makeUser();

    expect(await getUserRank(contest.id, outsider.id)).toBeNull();
  });
});
