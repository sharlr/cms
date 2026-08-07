import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell, PageHeader } from "@/components/AppShell";
import { getCurrentUser, getNavUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Messages" };

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const navUser = await getNavUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // La consultation de la page vaut lecture de tous les messages.
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return (
    <AppShell user={navUser} width="narrow">
      <PageHeader
        title="Mes messages"
        description="Rappels de dates, résultats officiels et communiqués de l'association."
      />

      {notifications.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-4xl" aria-hidden="true">
            ✉️
          </p>
          <p className="mt-3 font-semibold text-ink">Aucun message</p>
          <p className="mt-1 text-sm text-ink-soft">
            Vous serez prévenu ici des dates du concours et de vos résultats.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={`card p-5 ${
                notification.readAt === null ? "border-brand-300 bg-brand-50/50" : ""
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="font-bold text-ink">{notification.title}</h2>
                <time
                  dateTime={notification.createdAt.toISOString()}
                  className="text-xs text-ink-faint"
                >
                  {formatDate(notification.createdAt)}
                </time>
              </div>
              <p className="mt-2 text-[0.925rem] leading-relaxed whitespace-pre-line text-ink-soft">
                {notification.body}
              </p>
              {notification.linkUrl ? (
                <Link
                  href={notification.linkUrl}
                  className="mt-3 inline-block text-sm font-semibold text-brand-600 underline-offset-4 hover:underline"
                >
                  En savoir plus →
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
