import { AppShell, PageHeader } from "@/components/AppShell";
import { RichText } from "@/components/RichText";
import { getNavUser } from "@/lib/auth";
import { getSitePage } from "@/lib/content";
import { formatDay } from "@/lib/format";

export const metadata = { title: "Règlement du concours" };

export default async function ReglementPage() {
  const [page, navUser] = await Promise.all([getSitePage("reglement"), getNavUser()]);

  return (
    <AppShell user={navUser} width="narrow">
      <PageHeader
        eyebrow="Concours National de Logique"
        title={page.title}
        description={
          page.updatedAt ? `Mis à jour le ${formatDay(page.updatedAt)}.` : undefined
        }
      />
      <article className="card p-6 sm:p-8">
        <RichText body={page.body} />
      </article>
    </AppShell>
  );
}
