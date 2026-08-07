import { AdminShell, Crumbs } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { deletePartnerAction } from "@/app/admin/content-actions";
import { PartnerForm } from "./PartnerForm";

export const metadata = { title: "Partenaires" };

export default async function AdminPartenairesPage() {
  await requireAdmin();

  const partners = await prisma.partner.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
  const nextPosition = (partners.at(-1)?.position ?? 0) + 1;

  return (
    <AdminShell
      title="Partenaires"
      breadcrumb={
        <Crumbs items={[{ href: "/admin", label: "Administration" }, { label: "Partenaires" }]} />
      }
      description="Partenaires institutionnels, académiques et financiers affichés en pied de page d'accueil."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section>
          <h2 className="mb-3 text-lg font-extrabold text-ink">
            {partners.length} partenaire(s)
          </h2>

          {partners.length === 0 ? (
            <p className="card p-10 text-center text-sm text-ink-soft">
              Aucun partenaire enregistré.
            </p>
          ) : (
            <ul className="space-y-2">
              {partners.map((partner) => (
                <li key={partner.id} className="card flex flex-wrap items-center gap-4 px-5 py-3">
                  <span className="w-8 shrink-0 font-bold text-ink-faint tabular-nums">
                    {partner.position}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{partner.name}</p>
                    {partner.websiteUrl ? (
                      <p className="truncate text-xs text-ink-faint">{partner.websiteUrl}</p>
                    ) : null}
                  </div>
                  <form action={deletePartnerAction}>
                    <input type="hidden" name="partnerId" value={partner.id} />
                    <button type="submit" className="text-sm font-semibold text-ko underline">
                      Retirer
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="card h-fit p-5">
          <h2 className="mb-4 text-sm font-bold tracking-[0.14em] text-ink-faint uppercase">
            Ajouter un partenaire
          </h2>
          <PartnerForm nextPosition={nextPosition} />
        </aside>
      </div>
    </AdminShell>
  );
}
