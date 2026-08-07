import Link from "next/link";
import { AdminShell, Crumbs } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { getSitePage, SITE_PAGES, SITE_PAGE_SLUGS } from "@/lib/content";
import { SitePageForm } from "./SitePageForm";

export const metadata = { title: "Pages" };

export default async function AdminPagesPage(props: PageProps<"/admin/pages">) {
  await requireAdmin();
  const params = await props.searchParams;

  const requested = typeof params.page === "string" ? params.page : undefined;
  const slug = SITE_PAGE_SLUGS.find((s) => s === requested) ?? SITE_PAGE_SLUGS[0];
  const page = await getSitePage(slug);

  return (
    <AdminShell
      title="Pages du site"
      breadcrumb={<Crumbs items={[{ href: "/admin", label: "Administration" }, { label: "Pages" }]} />}
      description="Contenus éditoriaux affichés aux candidats : règlement, contact et récompenses."
    >
      <nav className="mb-6 flex flex-wrap gap-2">
        {SITE_PAGE_SLUGS.map((item) => (
          <Link
            key={item}
            href={`/admin/pages?page=${item}`}
            aria-current={item === slug ? "page" : undefined}
            className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
              item === slug
                ? "bg-brand-500 text-white shadow-[0_3px_0_var(--color-brand-700)]"
                : "border border-hairline bg-surface text-ink-soft hover:border-hairline-strong hover:text-ink"
            }`}
          >
            {SITE_PAGES[item]}
          </Link>
        ))}
      </nav>

      <div className="card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-ink">{SITE_PAGES[slug]}</h2>
          <Link
            href={`/${slug}`}
            className="text-sm font-semibold text-brand-600 underline-offset-4 hover:underline"
          >
            Voir la page publique →
          </Link>
        </div>

        <SitePageForm slug={slug} title={page.title} body={page.body} />
      </div>
    </AdminShell>
  );
}
