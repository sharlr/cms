"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  /**
   * Valeurs ressaisies renvoyées au formulaire. React réinitialise un formulaire
   * dès que son action se termine : sans cet écho, la moindre erreur de
   * validation viderait tout ce que le candidat a saisi. Les mots de passe en
   * sont volontairement exclus.
   */
  values?: Record<string, string>;
  /**
   * Identifiant unique de la soumission, utilisé comme `key` du formulaire.
   * React n'applique `defaultValue` qu'au montage : sans ce remontage, les
   * valeurs ressaisies renvoyées ci-dessus ne seraient pas reprises par les
   * champs déjà montés.
   */
  submissionId?: string;
};

const ECHOED_FIELDS = [
  "fullName",
  "gender",
  "birthDate",
  "city",
  "educationLevel",
  "otherLevel",
  "phone",
  "email",
] as const;

function echoValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of ECHOED_FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string" && value !== "") values[field] = value;
  }
  if (formData.get("acceptedTerms") === "on") values.acceptedTerms = "on";
  return values;
}

function echo(formData: FormData) {
  return { values: echoValues(formData), submissionId: crypto.randomUUID() };
}

const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, "Indiquez votre nom et prénom."),
    gender: z.enum(["MASCULIN", "FEMININ"], { message: "Sélectionnez votre sexe." }),
    birthDate: z
      .string()
      .min(1, "Indiquez votre date de naissance.")
      .refine((v) => !Number.isNaN(Date.parse(v)), "Date de naissance invalide.")
      .refine((v) => new Date(v) < new Date(), "La date de naissance doit être passée."),
    city: z.enum(["DJIBOUTI_VILLE", "TADJOURAH", "DIKHIL", "ARTA", "ALI_SABIEH"], {
      message: "Sélectionnez votre ville.",
    }),
    educationLevel: z.enum(["PRIMAIRE", "COLLEGE", "LYCEE", "UNIVERSITE", "AUTRE"], {
      message: "Sélectionnez votre niveau scolaire.",
    }),
    otherLevel: z.string().trim().optional(),
    phone: z
      .string()
      .trim()
      .min(6, "Numéro de téléphone invalide.")
      .regex(/^[+0-9 ().-]+$/, "Numéro de téléphone invalide."),
    email: z.string().trim().toLowerCase().email("Adresse e-mail invalide."),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    confirmPassword: z.string(),
    acceptedTerms: z.literal("on", {
      message: "Vous devez accepter le règlement du concours.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les deux mots de passe ne correspondent pas.",
  })
  .refine((data) => data.educationLevel !== "AUTRE" || !!data.otherLevel, {
    path: ["otherLevel"],
    message: "Précisez votre niveau scolaire.",
  });

export async function registerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return {
      fieldErrors,
      error: "Veuillez corriger les champs signalés.",
      ...echo(formData),
    };
  }

  const data = parsed.data;

  const clash = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { phone: data.phone }] },
    select: { email: true },
  });
  if (clash) {
    return {
      error:
        clash.email === data.email
          ? "Un compte existe déjà avec cette adresse e-mail."
          : "Un compte existe déjà avec ce numéro de téléphone.",
      ...echo(formData),
    };
  }

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      gender: data.gender,
      birthDate: new Date(data.birthDate),
      city: data.city,
      educationLevel: data.educationLevel,
      otherLevel: data.educationLevel === "AUTRE" ? data.otherLevel : null,
      phone: data.phone,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      acceptedTerms: true,
    },
    select: { id: true },
  });

  await createSession(user.id);
  redirect("/accueil");
}

const loginSchema = z.object({
  login: z.string().trim().min(1, "Saisissez votre e-mail ou votre téléphone."),
  password: z.string().min(1, "Saisissez votre mot de passe."),
});

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Saisissez votre identifiant et votre mot de passe." };
  }

  const { login, password } = parsed.data;
  const loginEcho = { values: { login }, submissionId: crypto.randomUUID() };
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: login.toLowerCase() }, { phone: login }] },
    select: { id: true, passwordHash: true },
  });

  // Message identique dans les deux cas : ne pas révéler l'existence d'un compte.
  const invalid = { error: "Identifiant ou mot de passe incorrect.", ...loginEcho };
  if (!user) return invalid;
  if (!(await verifyPassword(password, user.passwordHash))) return invalid;

  await createSession(user.id);
  redirect("/accueil");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
