import { prisma } from "@/lib/prisma";

/**
 * Envoi d'un courriel.
 *
 * Aucun fournisseur SMTP n'est câblé : en l'absence de `MAIL_WEBHOOK_URL`, le
 * message est journalisé et considéré comme non envoyé. Brancher un service
 * transactionnel revient à renseigner cette variable — le reste de
 * l'application n'a pas à changer.
 */
export type MailMessage = { to: string; subject: string; body: string };

export async function sendEmail(message: MailMessage): Promise<boolean> {
  const endpoint = process.env.MAIL_WEBHOOK_URL;

  if (!endpoint) {
    console.info(`[courriel non envoyé — MAIL_WEBHOOK_URL absent] ${message.to} — ${message.subject}`);
    return false;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    return response.ok;
  } catch (error) {
    console.error("Échec de l'envoi du courriel :", error);
    return false;
  }
}

/**
 * Dépose un message privé dans l'application et tente le courriel jumeau.
 * `emailedAt` n'est renseigné que si le courriel est effectivement parti.
 */
export async function notifyUser({
  userId,
  title,
  body,
  linkUrl,
  email,
}: {
  userId: string;
  title: string;
  body: string;
  linkUrl?: string;
  email?: string | null;
}) {
  const emailed = email ? await sendEmail({ to: email, subject: title, body }) : false;

  return prisma.notification.create({
    data: {
      userId,
      title,
      body,
      linkUrl: linkUrl ?? null,
      emailedAt: emailed ? new Date() : null,
    },
  });
}

/** Diffuse le même message à un ensemble de candidats. */
export async function notifyMany({
  userIds,
  title,
  body,
  linkUrl,
}: {
  userIds: string[];
  title: string;
  body: string;
  linkUrl?: string;
}) {
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true },
  });

  let sent = 0;
  for (const user of users) {
    await notifyUser({ userId: user.id, title, body, linkUrl, email: user.email });
    sent += 1;
  }
  return sent;
}
