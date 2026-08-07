import { AdminShell, Crumbs } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { BroadcastForm } from "./BroadcastForm";

export const metadata = { title: "Messages" };

export default async function AdminMessagesPage() {
  await requireAdmin();

  const [contests, recent, unreadCount] = await Promise.all([
    prisma.contest.findMany({
      orderBy: [{ edition: "desc" }, { mode: "asc" }],
      select: { id: true, title: true },
    }),
    // Un envoi groupé crée une notification par destinataire : on regroupe par
    // titre pour présenter une ligne par diffusion.
    prisma.notification.groupBy({
      by: ["title"],
      _count: true,
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: "desc" } },
      take: 15,
    }),
    prisma.notification.count({ where: { readAt: null } }),
  ]);

  return (
    <AdminShell
      title="Messages aux candidats"
      breadcrumb={<Crumbs items={[{ href: "/admin", label: "Administration" }, { label: "Messages" }]} />}
      description="Rappelez la date du concours, annoncez les résultats officiels ou diffusez un communiqué."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="card p-6">
          <BroadcastForm contests={contests} />
        </div>

        <aside className="card h-fit p-5">
          <h2 className="text-sm font-bold tracking-[0.14em] text-ink-faint uppercase">
            Diffusions récentes
          </h2>
          <p className="mt-2 text-xs text-ink-faint">{unreadCount} message(s) non lu(s)</p>

          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">Aucun message envoyé.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {recent.map((row) => (
                <li key={row.title} className="border-t border-hairline pt-3 first:border-0 first:pt-0">
                  <p className="text-sm font-semibold text-ink">{row.title}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {row._count} destinataire(s)
                    {row._max.createdAt ? ` · ${formatDate(row._max.createdAt)}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </AdminShell>
  );
}
