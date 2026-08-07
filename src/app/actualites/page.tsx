import { AppShell, PageHeader } from "@/components/AppShell";
import { NewsCard } from "@/components/NewsCard";
import { getNavUser } from "@/lib/auth";
import { getPublishedNews } from "@/lib/content";

export const metadata = { title: "Actualités" };

export default async function ActualitesPage() {
  const [news, navUser] = await Promise.all([getPublishedNews(), getNavUser()]);

  return (
    <AppShell user={navUser} width="wide">
      <PageHeader
        eyebrow="Informations"
        title="Actualités du concours"
        description="Annonces, dates d'inscription, horaires des épreuves, résultats officiels et communiqués de l'association."
      />

      {news.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-4xl" aria-hidden="true">
            📰
          </p>
          <p className="mt-3 font-semibold text-ink">Aucune actualité publiée</p>
          <p className="mt-1 text-sm text-ink-soft">
            Les annonces de l&apos;association apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {news.map((item, index) => (
            <NewsCard key={item.id} news={item} featured={index === 0 && item.isPinned} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
