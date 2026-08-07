"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { parseQuestionWorkbook } from "@/lib/question-import";

export type AdminState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Détail ligne à ligne, utilisé par le rapport d'import Excel. */
  details?: string[];
  ok?: string;
};

function collectErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return fieldErrors;
}

/** `datetime-local` vide ⇒ pas de borne ; sinon une date valide. */
const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || !Number.isNaN(Date.parse(value)), "Date invalide.")
  .transform((value) => (value === null ? null : new Date(value)));

const contestSchema = z
  .object({
    title: z.string().trim().min(3, "Le titre est trop court."),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2, "L'identifiant est trop court.")
      .regex(/^[a-z0-9-]+$/, "Lettres minuscules, chiffres et tirets uniquement."),
    mode: z.enum(["ENTRAINEMENT", "SELECTION"], { message: "Mode invalide." }),
    instructions: z.string().trim().min(10, "Les consignes sont trop courtes."),
    information: z.string().trim().optional(),
    secondsPerQuestion: z.coerce
      .number()
      .int()
      .min(5, "Au moins 5 secondes.")
      .max(3600, "Au plus 3600 secondes."),
    edition: z.coerce
      .number()
      .int()
      .min(2000, "Édition invalide.")
      .max(2100, "Édition invalide."),
    isActive: z.union([z.literal("on"), z.undefined()]).transform((v) => v === "on"),
    startsAt: optionalDate,
    opensAt: optionalDate,
    closesAt: optionalDate,
  })
  .refine((d) => !d.opensAt || !d.closesAt || d.opensAt < d.closesAt, {
    path: ["closesAt"],
    message: "La clôture doit suivre l'ouverture.",
  })
  .refine((d) => !d.startsAt || !d.closesAt || d.startsAt < d.closesAt, {
    path: ["startsAt"],
    message: "L'épreuve doit commencer avant la clôture.",
  });

export async function saveContestAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const contestId = String(formData.get("contestId") ?? "");
  const parsed = contestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: collectErrors(parsed.error), error: "Corrigez les champs signalés." };
  }
  const data = parsed.data;

  const clash = await prisma.contest.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });
  if (clash && clash.id !== contestId) {
    return { fieldErrors: { slug: "Cet identifiant est déjà utilisé." } };
  }

  const values = {
    title: data.title,
    slug: data.slug,
    mode: data.mode,
    instructions: data.instructions,
    information: data.information || null,
    secondsPerQuestion: data.secondsPerQuestion,
    edition: data.edition,
    isActive: data.isActive,
    startsAt: data.startsAt,
    opensAt: data.opensAt,
    closesAt: data.closesAt,
  };

  if (contestId) {
    await prisma.contest.update({ where: { id: contestId }, data: values });
    revalidatePath("/admin");
    revalidatePath(`/admin/concours/${contestId}`);
    return { ok: "Concours enregistré." };
  }

  const created = await prisma.contest.create({
    data: { ...values, questionCount: 0 },
    select: { id: true },
  });
  revalidatePath("/admin");
  redirect(`/admin/concours/${created.id}`);
}

/**
 * Suppression d'un concours. L'opération efface aussi ses questions et toutes
 * les participations enregistrées : l'administrateur doit ressaisir le slug du
 * concours pour confirmer, afin qu'un clic isolé ne puisse pas la déclencher.
 */
export async function deleteContestAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const contestId = String(formData.get("contestId") ?? "");
  const confirmation = String(formData.get("confirmSlug") ?? "").trim();
  if (!contestId) return { error: "Concours introuvable." };

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: { slug: true },
  });
  if (!contest) return { error: "Concours introuvable." };

  if (confirmation !== contest.slug) {
    return {
      fieldErrors: {
        confirmSlug: `Saisissez « ${contest.slug} » pour confirmer la suppression.`,
      },
    };
  }

  await prisma.contest.delete({ where: { id: contestId } });
  revalidatePath("/admin");
  redirect("/admin");
}

const questionSchema = z
  .object({
    body: z.string().trim().min(5, "L'énoncé est trop court."),
    type: z.enum(["QCM", "LIBRE"], { message: "Type invalide." }),
    points: z.coerce.number().int().min(1, "Au moins 1 point.").max(100),
    // QCM
    choiceA: z.string().trim().optional(),
    choiceB: z.string().trim().optional(),
    choiceC: z.string().trim().optional(),
    choiceD: z.string().trim().optional(),
    correctLabel: z.string().trim().optional(),
    // Réponse libre
    correctText: z.string().trim().optional(),
    explanation: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "QCM") {
      for (const label of ["A", "B", "C", "D"] as const) {
        const value = data[`choice${label}` as const];
        if (!value) {
          ctx.addIssue({
            code: "custom",
            path: [`choice${label}`],
            message: `La proposition ${label} est obligatoire.`,
          });
        }
      }
      if (!["A", "B", "C", "D"].includes(data.correctLabel ?? "")) {
        ctx.addIssue({
          code: "custom",
          path: ["correctLabel"],
          message: "Désignez la bonne réponse.",
        });
      }
    } else if (!data.correctText) {
      ctx.addIssue({
        code: "custom",
        path: ["correctText"],
        message: "Indiquez la réponse attendue.",
      });
    }
  });

export async function saveQuestionAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const contestId = String(formData.get("contestId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  if (!contestId) return { error: "Concours introuvable." };

  const parsed = questionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: collectErrors(parsed.error), error: "Corrigez les champs signalés." };
  }
  const data = parsed.data;

  const isQcm = data.type === "QCM";
  const correctAnswer = isQcm ? data.correctLabel! : data.correctText!;
  const choices = isQcm
    ? [
        { label: "A", text: data.choiceA! },
        { label: "B", text: data.choiceB! },
        { label: "C", text: data.choiceC! },
        { label: "D", text: data.choiceD! },
      ]
    : [];

  if (questionId) {
    await prisma.$transaction([
      prisma.choice.deleteMany({ where: { questionId } }),
      prisma.question.update({
        where: { id: questionId },
        data: {
          body: data.body,
          type: data.type,
          points: data.points,
          correctAnswer,
          explanation: data.explanation || null,
          choices: { create: choices },
        },
      }),
    ]);
  } else {
    const last = await prisma.question.findFirst({
      where: { contestId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    await prisma.question.create({
      data: {
        contestId,
        position: (last?.position ?? 0) + 1,
        body: data.body,
        type: data.type,
        points: data.points,
        correctAnswer,
        explanation: data.explanation || null,
        choices: { create: choices },
      },
    });
  }

  await syncQuestionCount(contestId);
  revalidatePath(`/admin/concours/${contestId}`);
  redirect(`/admin/concours/${contestId}`);
}

export async function deleteQuestionAction(formData: FormData) {
  await requireAdmin();
  const contestId = String(formData.get("contestId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  if (!questionId || !contestId) return;

  await prisma.question.delete({ where: { id: questionId } });
  await renumberQuestions(contestId);
  await syncQuestionCount(contestId);
  revalidatePath(`/admin/concours/${contestId}`);
}

/** Déplace une question d'un cran vers le haut ou vers le bas. */
export async function moveQuestionAction(formData: FormData) {
  await requireAdmin();
  const contestId = String(formData.get("contestId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  const direction = formData.get("direction") === "up" ? -1 : 1;
  if (!questionId || !contestId) return;

  const questions = await prisma.question.findMany({
    where: { contestId },
    orderBy: { position: "asc" },
    select: { id: true, position: true },
  });

  const index = questions.findIndex((q) => q.id === questionId);
  const target = index + direction;
  if (index === -1 || target < 0 || target >= questions.length) return;

  // Position temporaire : la contrainte d'unicité (contestId, position)
  // interdit d'écrire directement la position de la question voisine.
  await prisma.$transaction([
    prisma.question.update({ where: { id: questions[index].id }, data: { position: -1 } }),
    prisma.question.update({
      where: { id: questions[target].id },
      data: { position: questions[index].position },
    }),
    prisma.question.update({
      where: { id: questions[index].id },
      data: { position: questions[target].position },
    }),
  ]);

  revalidatePath(`/admin/concours/${contestId}`);
}

/**
 * Import de questions depuis un classeur Excel.
 *
 * Tout ou rien : si une seule ligne est invalide, rien n'est enregistré et le
 * rapport d'erreurs est renvoyé — un import à moitié appliqué serait plus
 * pénible à rattraper qu'un import refusé.
 */
export async function importQuestionsAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const contestId = String(formData.get("contestId") ?? "");
  const file = formData.get("file");
  if (!contestId) return { error: "Concours introuvable." };
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Sélectionnez un fichier Excel (.xlsx)." };
  }
  if (file.size > 5_000_000) {
    return { error: "Fichier trop volumineux (5 Mo maximum)." };
  }

  let report;
  try {
    report = await parseQuestionWorkbook(await file.arrayBuffer());
  } catch {
    return { error: "Fichier illisible : vérifiez qu'il s'agit bien d'un classeur .xlsx." };
  }

  if (report.errors.length > 0) {
    return {
      error: `Import annulé — ${report.errors.length} ligne(s) invalide(s).`,
      details: report.errors.slice(0, 15),
    };
  }
  if (report.questions.length === 0) {
    return { error: "Aucune question trouvée dans le fichier." };
  }

  const replace = formData.get("replace") === "on";
  if (replace) {
    await prisma.question.deleteMany({ where: { contestId } });
  }

  const last = await prisma.question.findFirst({
    where: { contestId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  let position = (last?.position ?? 0) + 1;

  for (const question of report.questions) {
    await prisma.question.create({
      data: {
        contestId,
        position,
        type: question.type,
        body: question.body,
        correctAnswer: question.correctAnswer,
        points: question.points,
        choices: { create: question.choices },
      },
    });
    position += 1;
  }

  await syncQuestionCount(contestId);
  revalidatePath(`/admin/concours/${contestId}`);
  redirect(`/admin/concours/${contestId}`);
}

/** Renumérote les questions de 1 à N après une suppression. */
async function renumberQuestions(contestId: string) {
  const questions = await prisma.question.findMany({
    where: { contestId },
    orderBy: { position: "asc" },
    select: { id: true },
  });

  // Deux passes : on libère d'abord la plage 1..N pour ne pas heurter la
  // contrainte d'unicité pendant la renumérotation.
  await prisma.$transaction([
    ...questions.map((q, index) =>
      prisma.question.update({ where: { id: q.id }, data: { position: -(index + 1) } }),
    ),
    ...questions.map((q, index) =>
      prisma.question.update({ where: { id: q.id }, data: { position: index + 1 } }),
    ),
  ]);
}

/** Le nombre de questions annoncé au candidat suit la banque réelle. */
async function syncQuestionCount(contestId: string) {
  const questionCount = await prisma.question.count({ where: { contestId } });
  await prisma.contest.update({ where: { id: contestId }, data: { questionCount } });
}
