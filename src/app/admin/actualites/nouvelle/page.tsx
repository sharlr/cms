import { AdminShell, Crumbs } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { NewsForm } from "@/app/admin/actualites/NewsForm";

export const metadata = { title: "Nouvelle actualité" };

export default async function NouvelleActualitePage() {
  await requireAdmin();

  return (
    <AdminShell
      title="Nouvelle actualité"
      breadcrumb={
        <Crumbs
          items={[
            { href: "/admin", label: "Administration" },
            { href: "/admin/actualites", label: "Actualités" },
            { label: "Nouvelle" },
          ]}
        />
      }
    >
      <div className="card p-6">
        <NewsForm
          news={{
            title: "",
            body: "",
            imageUrl: "",
            videoUrl: "",
            isPinned: false,
            published: true,
          }}
        />
      </div>
    </AdminShell>
  );
}
