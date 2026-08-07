import { AppShell, PageHeader } from "@/components/AppShell";
import { ButtonLink } from "@/components/Button";
import { RichText } from "@/components/RichText";
import { PartnerStrip } from "@/components/PartnerStrip";
import { getNavUser } from "@/lib/auth";
import { getPartners, getSitePage } from "@/lib/content";

export const metadata = { title: "Récompenses" };

const HIGHLIGHTS = [
  {
    emoji: "🏆",
    title: "Des prix pour les lauréats",
    text: "Les prix et cadeaux sont définis chaque année avec les partenaires du concours.",
  },
  {
    emoji: "🎁",
    title: "Tous les sélectionnés récompensés",
    text: "Chaque candidat sélectionné reçoit une récompense remise lors de la cérémonie nationale.",
  },
  {
    emoji: "📜",
    title: "Un certificat officiel",
    text: "Un certificat de participation signé par l'association, téléchargeable depuis votre espace.",
  },
];

export default async function RecompensesPage() {
  const [page, partners, navUser] = await Promise.all([
    getSitePage("recompenses"),
    getPartners(),
    getNavUser(),
  ]);

  return (
    <AppShell user={navUser}>
      <PageHeader
        eyebrow="Concours National de Logique"
        title="Les récompenses"
        description="Participez au Concours National de Logique et tentez de remporter de nombreux prix !"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {HIGHLIGHTS.map((item) => (
          <article key={item.title} className="card p-6">
            <span className="text-3xl" aria-hidden="true">
              {item.emoji}
            </span>
            <h2 className="mt-3 font-bold text-ink">{item.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{item.text}</p>
          </article>
        ))}
      </div>

      <article className="card mt-6 p-6 sm:p-8">
        <RichText body={page.body} />
      </article>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {navUser ? (
          <ButtonLink href="/accueil" variant="gold" size="lg">
            Retour à mon espace
          </ButtonLink>
        ) : (
          <ButtonLink href="/inscription" variant="gold" size="lg">
            S&apos;inscrire au concours
          </ButtonLink>
        )}
      </div>

      <PartnerStrip partners={partners} className="mt-14" />
    </AppShell>
  );
}
