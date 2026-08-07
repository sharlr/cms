import Link from "next/link";
import { AdminShell, Crumbs } from "@/components/AdminShell";
import { ButtonLink } from "@/components/Button";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { deleteNewsAction } from "@/app/admin/content-actions";

export const metadata = { title: "Actualités" };

export default async function AdminActualitesPage() {
  await requireAdmin();

  const news = await prisma.news.findMany({
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  return (
    <AdminShell
      title="Actualités"
      breadcrumb={<Crumbs items={[{ href: "/admin", label: "Administration" }, { label: "Actualités" }]} />}
      description="Annonces, dates d'inscription, horaires des épreuves, résultats officiels et communiqués. Les publications apparaissent immédiatement sur l'accueil."
      actions={
        <ButtonLink href="/admin/actualites/nouvelle" variant="brand" size="sm">
          Nouvelle actualité
        </ButtonLink>
      }
    >
      {news.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-semibold text-ink">Aucune actualité</p>
          <p className="mt-1 text-sm text-ink-soft">
            Publiez une annonce pour informer les candidats.
          </p>
          <ButtonLink href="/admin/actualites/nouvelle" variant="brand" className="mt-5">
            Créer une actualité
          </ButtonLink>
        </div>
      ) : (
        <ul className="space-y-3">
          {news.map((item) => (
            <li key={item.id} className="card flex flex-wrap items-start gap-4 p-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/actualites/${item.id}`}
                    className="font-bold text-ink underline-offset-4 hover:underline"
                  >
                    {item.title}
                  </Link>
                  {item.isPinned ? (
                    <span className="pill bg-gold-100 text-gold-700">À la une</span>
                  ) : null}
                  {item.publishedAt ? (
                    <span className="pill bg-ok-soft text-ok">Publiée</span>
                  ) : (
                    <span className="pill bg-surface-sunken text-ink-faint">Brouillon</span>
                  )}
                </div>

                <p className="mt-1.5 line-clamp-2 text-sm text-ink-soft">{item.body}</p>
                <p className="mt-1.5 text-xs text-ink-faint">
                  {item.publishedAt
                    ? `Publiée le ${formatDate(item.publishedAt)}`
                    : `Créée le ${formatDate(item.createdAt)}`}
                </p>
              </div>

              <div className="flex items-center gap-3 text-sm font-semibold">
                <Link href={`/admin/actualites/${item.id}`} className="text-brand-600 underline">
                  Modifier
                </Link>
                <form action={deleteNewsAction}>
                  <input type="hidden" name="newsId" value={item.id} />
                  <button type="submit" className="text-ko underline">
                    Supprimer
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
