import { notFound } from "next/navigation";
import { AdminShell, Crumbs } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { NewsForm } from "@/app/admin/actualites/NewsForm";

export const metadata = { title: "Modifier l'actualité" };

export default async function EditerActualitePage(
  props: PageProps<"/admin/actualites/[newsId]">,
) {
  await requireAdmin();
  const { newsId } = await props.params;

  const news = await prisma.news.findUnique({ where: { id: newsId } });
  if (!news) notFound();

  return (
    <AdminShell
      title={news.title}
      breadcrumb={
        <Crumbs
          items={[
            { href: "/admin", label: "Administration" },
            { href: "/admin/actualites", label: "Actualités" },
            { label: news.title },
          ]}
        />
      }
    >
      <div className="card p-6">
        <NewsForm
          news={{
            id: news.id,
            title: news.title,
            body: news.body,
            imageUrl: news.imageUrl ?? "",
            videoUrl: news.videoUrl ?? "",
            isPinned: news.isPinned,
            published: news.publishedAt !== null,
          }}
        />
      </div>
    </AdminShell>
  );
}
