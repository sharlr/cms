"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { notifyMany } from "@/lib/notify";
import { isSitePageSlug } from "@/lib/content";
import type { AdminState } from "@/app/admin/actions";

function collectErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return fieldErrors;
}

/** URL http(s) ou chemin interne — jamais de `javascript:`. */
const safeUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null))
  .refine(
    (value) => value === null || /^(https?:\/\/|\/)/i.test(value),
    "Indiquez une adresse commençant par http(s):// ou /.",
  );

// ---------------------------------------------------------------- actualités

const newsSchema = z.object({
  title: z.string().trim().min(3, "Le titre est trop court."),
  body: z.string().trim().min(10, "Le contenu est trop court."),
  imageUrl: safeUrl,
  videoUrl: safeUrl,
  isPinned: z.union([z.literal("on"), z.undefined()]).transform((v) => v === "on"),
  publish: z.union([z.literal("on"), z.undefined()]).transform((v) => v === "on"),
});

export async function saveNewsAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const newsId = String(formData.get("newsId") ?? "");
  const parsed = newsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: collectErrors(parsed.error), error: "Corrigez les champs signalés." };
  }
  const data = parsed.data;

  const existing = newsId
    ? await prisma.news.findUnique({ where: { id: newsId }, select: { publishedAt: true } })
    : null;

  // On conserve la date de première publication : rééditer une annonce ne doit
  // pas la faire remonter en tête du fil.
  const publishedAt = data.publish ? (existing?.publishedAt ?? new Date()) : null;

  const values = {
    title: data.title,
    body: data.body,
    imageUrl: data.imageUrl,
    videoUrl: data.videoUrl,
    isPinned: data.isPinned,
    publishedAt,
  };

  if (newsId) {
    await prisma.news.update({ where: { id: newsId }, data: values });
  } else {
    await prisma.news.create({ data: values });
  }

  revalidatePath("/actualites");
  revalidatePath("/");
  redirect("/admin/actualites");
}

export async function deleteNewsAction(formData: FormData) {
  await requireAdmin();
  const newsId = String(formData.get("newsId") ?? "");
  if (newsId) await prisma.news.delete({ where: { id: newsId } });

  revalidatePath("/actualites");
  revalidatePath("/admin/actualites");
}

// --------------------------------------------------------------------- pages

const pageSchema = z.object({
  slug: z.string().trim().min(1),
  title: z.string().trim().min(3, "Le titre est trop court."),
  body: z.string().trim().min(20, "Le contenu est trop court."),
});

export async function saveSitePageAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const parsed = pageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: collectErrors(parsed.error), error: "Corrigez les champs signalés." };
  }
  const { slug, title, body } = parsed.data;

  if (!isSitePageSlug(slug)) return { error: "Page inconnue." };

  await prisma.sitePage.upsert({
    where: { slug },
    update: { title, body },
    create: { slug, title, body },
  });

  revalidatePath(`/${slug}`);
  return { ok: "Page enregistrée." };
}

// --------------------------------------------------------------- partenaires

const partnerSchema = z.object({
  name: z.string().trim().min(2, "Le nom est trop court."),
  logoUrl: safeUrl,
  websiteUrl: safeUrl,
  position: z.coerce.number().int().min(0).max(999),
});

export async function savePartnerAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const partnerId = String(formData.get("partnerId") ?? "");
  const parsed = partnerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: collectErrors(parsed.error), error: "Corrigez les champs signalés." };
  }

  if (partnerId) {
    await prisma.partner.update({ where: { id: partnerId }, data: parsed.data });
  } else {
    await prisma.partner.create({ data: parsed.data });
  }

  revalidatePath("/");
  revalidatePath("/admin/partenaires");
  return { ok: "Partenaire enregistré." };
}

export async function deletePartnerAction(formData: FormData) {
  await requireAdmin();
  const partnerId = String(formData.get("partnerId") ?? "");
  if (partnerId) await prisma.partner.delete({ where: { id: partnerId } });

  revalidatePath("/");
  revalidatePath("/admin/partenaires");
}

// ------------------------------------------------------------------ messages

const broadcastSchema = z.object({
  title: z.string().trim().min(3, "Le titre est trop court."),
  body: z.string().trim().min(10, "Le message est trop court."),
  linkUrl: safeUrl,
  audience: z.enum(["ALL", "FINISHED", "NOT_STARTED"]).catch("ALL"),
  contestId: z.string().trim().optional(),
});

/**
 * Diffusion d'un message privé (application + courriel) à un public choisi :
 * tous les candidats, ceux qui ont terminé un concours donné, ou ceux qui ne
 * l'ont pas encore passé — de quoi envoyer un rappel avant l'épreuve.
 */
export async function broadcastAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const parsed = broadcastSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: collectErrors(parsed.error), error: "Corrigez les champs signalés." };
  }
  const { title, body, linkUrl, audience, contestId } = parsed.data;

  if (audience !== "ALL" && !contestId) {
    return { fieldErrors: { contestId: "Choisissez un concours." } };
  }

  let userIds: string[];

  if (audience === "ALL") {
    const users = await prisma.user.findMany({
      where: { role: "CANDIDATE" },
      select: { id: true },
    });
    userIds = users.map((u) => u.id);
  } else {
    const finished = await prisma.attempt.findMany({
      where: { contestId, status: "TERMINEE" },
      select: { userId: true },
      distinct: ["userId"],
    });
    const finishedIds = finished.map((a) => a.userId);

    const users = await prisma.user.findMany({
      where: {
        role: "CANDIDATE",
        id: audience === "FINISHED" ? { in: finishedIds } : { notIn: finishedIds },
      },
      select: { id: true },
    });
    userIds = users.map((u) => u.id);
  }

  if (userIds.length === 0) {
    return { error: "Aucun destinataire ne correspond à ce public." };
  }

  const sent = await notifyMany({ userIds, title, body, linkUrl: linkUrl ?? undefined });

  revalidatePath("/admin/messages");
  return { ok: `Message envoyé à ${sent} candidat(s).` };
}
