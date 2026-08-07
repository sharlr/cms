import { AppShell, PageHeader } from "@/components/AppShell";
import { RichText } from "@/components/RichText";
import { getNavUser } from "@/lib/auth";
import { getPartners, getSitePage } from "@/lib/content";
import { PartnerStrip } from "@/components/PartnerStrip";

export const metadata = { title: "Contact" };

export default async function ContactPage() {
  const [page, partners, navUser] = await Promise.all([
    getSitePage("contact"),
    getPartners(),
    getNavUser(),
  ]);

  return (
    <AppShell user={navUser} width="narrow">
      <PageHeader
        eyebrow="Association organisatrice"
        title={page.title}
        description="Une question sur l'inscription, l'épreuve ou les résultats ? Contactez l'association."
      />
      <article className="card p-6 sm:p-8">
        <RichText body={page.body} />
      </article>

      <PartnerStrip partners={partners} className="mt-12" />
    </AppShell>
  );
}
