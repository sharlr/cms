"use server";

import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { startAttempt } from "@/lib/contest";

export type StartState = { error?: string };

/** Démarre (ou reprend) une tentative puis ouvre l'épreuve. */
export async function startAttemptAction(
  _prev: StartState,
  formData: FormData,
): Promise<StartState> {
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");

  const slug = String(formData.get("slug") ?? "");
  if (!slug) return { error: "Concours introuvable." };

  let attemptId: string;
  try {
    const attempt = await startAttempt(userId, slug);
    attemptId = attempt.id;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Impossible de démarrer l'épreuve.",
    };
  }

  redirect(`/epreuve/${attemptId}`);
}
