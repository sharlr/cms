import { prisma } from "@/lib/prisma";

/** Pages éditoriales connues de l'application. */
export const SITE_PAGES = {
  reglement: "Règlement du concours",
  contact: "Contact de l'association",
  recompenses: "Récompenses",
} as const;

export type SitePageSlug = keyof typeof SITE_PAGES;

export const SITE_PAGE_SLUGS = Object.keys(SITE_PAGES) as SitePageSlug[];

export function isSitePageSlug(value: string): value is SitePageSlug {
  return value in SITE_PAGES;
}

/** Contenu d'une page éditoriale, avec un repli si l'admin ne l'a pas remplie. */
export async function getSitePage(slug: SitePageSlug) {
  const page = await prisma.sitePage.findUnique({ where: { slug } });
  return (
    page ?? {
      slug,
      title: SITE_PAGES[slug],
      body: "Cette page sera renseignée prochainement par l'association.",
      updatedAt: null as Date | null,
    }
  );
}

/** Actualités publiées, épinglées en tête puis de la plus récente à la plus ancienne. */
export function getPublishedNews(limit?: number) {
  return prisma.news.findMany({
    where: { publishedAt: { not: null, lte: new Date() } },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    take: limit,
  });
}

export function getPartners() {
  return prisma.partner.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }] });
}

/**
 * Rend un texte saisi par l'administration : les lignes vides séparent les
 * paragraphes, les lignes préfixées par « - » forment une liste.
 *
 * Le contenu n'est jamais interprété comme du HTML — React échappe le texte.
 */
export type RichBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] };

export function parseRichText(body: string): RichBlock[] {
  const blocks: RichBlock[] = [];
  let list: string[] = [];

  const flush = () => {
    if (list.length > 0) {
      blocks.push({ kind: "list", items: list });
      list = [];
    }
  };

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (line === "") {
      flush();
      continue;
    }
    if (line.startsWith("-") || line.startsWith("•")) {
      list.push(line.slice(1).trim());
      continue;
    }

    flush();
    blocks.push({ kind: "paragraph", text: line });
  }

  flush();
  return blocks;
}
