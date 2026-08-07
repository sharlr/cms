import { notFound, redirect } from "next/navigation";
import { FocusShell } from "@/components/AppShell";
import { getSessionUserId } from "@/lib/auth";
import { serveCurrentQuestion } from "@/lib/contest";
import { QuizRunner } from "./QuizRunner";

export default async function EpreuvePage(props: PageProps<"/epreuve/[attemptId]">) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");

  const { attemptId } = await props.params;

  let initial;
  try {
    // Le chrono n'est pas armé ici : c'est le client qui le déclenche au montage.
    initial = await serveCurrentQuestion(attemptId, userId, { startClock: false });
  } catch {
    notFound();
  }

  if (initial.kind === "finished") redirect(`/resultats/${attemptId}`);

  return (
    <FocusShell>
      <QuizRunner attemptId={attemptId} initial={initial} />
    </FocusShell>
  );
}
