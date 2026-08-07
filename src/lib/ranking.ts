import { prisma } from "@/lib/prisma";

/**
 * Classement d'un concours.
 *
 * Critères du cahier des charges : nombre de bonnes réponses décroissant,
 * puis, à égalité, temps total de réponse le plus faible. Les ex æquo stricts
 * (même score *et* même temps) partagent le même rang, et le rang suivant
 * saute d'autant — classement « standard competition », comme en sport.
 *
 * Seules les tentatives terminées sont classées. En entrainement, un candidat
 * peut avoir plusieurs tentatives : on ne retient que sa meilleure.
 */
export type RankedAttempt = {
  rank: number;
  attemptId: string;
  userId: string;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  score: number;
  totalTimeMs: number;
  finishedAt: Date | null;
};

export async function getRanking(contestId: string): Promise<RankedAttempt[]> {
  const attempts = await prisma.attempt.findMany({
    where: { contestId, status: "TERMINEE" },
    orderBy: [{ correctCount: "desc" }, { totalTimeMs: "asc" }, { finishedAt: "asc" }],
    select: {
      id: true,
      userId: true,
      correctCount: true,
      wrongCount: true,
      unansweredCount: true,
      score: true,
      totalTimeMs: true,
      finishedAt: true,
    },
  });

  // Une seule ligne par candidat : la première rencontrée est la meilleure,
  // la requête étant déjà triée selon les critères de classement.
  const best = new Map<string, (typeof attempts)[number]>();
  for (const attempt of attempts) {
    if (!best.has(attempt.userId)) best.set(attempt.userId, attempt);
  }

  const ordered = [...best.values()];
  const ranked: RankedAttempt[] = [];

  for (const [index, attempt] of ordered.entries()) {
    const previous = ordered[index - 1];
    const tied =
      previous !== undefined &&
      previous.correctCount === attempt.correctCount &&
      previous.totalTimeMs === attempt.totalTimeMs;

    ranked.push({
      rank: tied ? ranked[index - 1].rank : index + 1,
      attemptId: attempt.id,
      userId: attempt.userId,
      correctCount: attempt.correctCount,
      wrongCount: attempt.wrongCount,
      unansweredCount: attempt.unansweredCount,
      score: attempt.score,
      totalTimeMs: attempt.totalTimeMs,
      finishedAt: attempt.finishedAt,
    });
  }

  return ranked;
}

/** Rang d'un candidat dans un concours, ou null s'il n'y figure pas. */
export async function getUserRank(contestId: string, userId: string) {
  const ranking = await getRanking(contestId);
  const row = ranking.find((r) => r.userId === userId);
  if (!row) return null;
  return { rank: row.rank, total: ranking.length };
}

/** Classement enrichi des informations candidat, pour l'admin et l'export. */
export async function getRankingWithUsers(contestId: string) {
  const ranking = await getRanking(contestId);
  if (ranking.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: ranking.map((r) => r.userId) } },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      gender: true,
      birthDate: true,
      city: true,
      educationLevel: true,
      otherLevel: true,
    },
  });

  const byId = new Map(users.map((u) => [u.id, u]));
  return ranking.flatMap((row) => {
    const user = byId.get(row.userId);
    return user ? [{ ...row, user }] : [];
  });
}
