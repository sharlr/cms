import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { HomeContent } from "@/components/HomeContent";
import { getCurrentUser, getNavUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { availabilityOf } from "@/lib/availability";
import { getPublishedNews } from "@/lib/content";

export const metadata = { title: "Mon espace" };

export default async function AccueilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  const navUser = await getNavUser();

  const [contests, news, lastAttempt] = await Promise.all([
    prisma.contest.findMany({
      where: { isActive: true },
      orderBy: [{ mode: "asc" }, { edition: "desc" }],
    }),
    getPublishedNews(2),
    prisma.attempt.findFirst({
      where: { userId: user.id, status: "TERMINEE" },
      orderBy: { finishedAt: "desc" },
      include: { contest: { select: { title: true, questionCount: true } } },
    }),
  ]);

  const availabilityMap: Record<string, any> = {};
  contests.forEach((contest) => {
    availabilityMap[contest.id] = availabilityOf(contest);
  });

  return (
    <AppShell user={navUser} width="wide">
      <HomeContent
        user={user}
        contests={contests}
        news={news}
        lastAttempt={lastAttempt}
        availabilityMap={availabilityMap}
      />
    </AppShell>
  );
}
