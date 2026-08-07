import type { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/auth";
import { serveCurrentQuestion, submitAnswer } from "@/lib/contest";

const bodySchema = z.object({
  position: z.number().int().positive(),
  given: z.string().nullable(),
});

/** Question courante de la tentative. */
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/epreuve/[attemptId]">,
) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Non authentifié." }, { status: 401 });

  const { attemptId } = await ctx.params;
  try {
    return Response.json(await serveCurrentQuestion(attemptId, userId));
  } catch {
    return Response.json({ error: "Tentative introuvable." }, { status: 404 });
  }
}

/** Enregistre la réponse à la question courante et sert la suivante. */
export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/epreuve/[attemptId]">,
) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Non authentifié." }, { status: 401 });

  const { attemptId } = await ctx.params;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  try {
    const result = await submitAnswer(
      attemptId,
      userId,
      parsed.data.position,
      parsed.data.given,
    );
    return Response.json(result);
  } catch {
    return Response.json({ error: "Tentative introuvable." }, { status: 404 });
  }
}
