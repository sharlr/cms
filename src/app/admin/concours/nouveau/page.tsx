import { AdminShell, Crumbs } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { ContestForm } from "@/app/admin/ContestForm";

const DEFAULT_INSTRUCTIONS = [
  "Le test comporte 20 questions.",
  "Deux types de questions peuvent être proposés : QCM avec les réponses A, B, C ou D ; questions à réponse libre (réponse à saisir).",
  "Pour les QCM, une seule réponse est correcte.",
  "Le candidat dispose de 30 secondes pour répondre à chaque question.",
  "Le candidat peut modifier sa réponse autant de fois qu'il le souhaite tant que le temps imparti n'est pas écoulé.",
  "À l'expiration des 30 secondes, la réponse sélectionnée (ou saisie) est automatiquement enregistrée.",
  "Si aucune réponse n'est fournie avant la fin du temps imparti, la question est considérée comme non répondue et est comptabilisée comme une mauvaise réponse.",
  "À la fin du temps imparti, l'application passe automatiquement à la question suivante.",
  "Une fois la question suivante affichée, il n'est plus possible de revenir en arrière ni de modifier les réponses aux questions précédentes.",
].join("\n");

export default async function NouveauConcoursPage() {
  await requireAdmin();

  return (
    <AdminShell
      title="Nouveau concours"
      breadcrumb={
        <Crumbs
          items={[
            { href: "/admin", label: "Administration" },
            { href: "/admin/concours", label: "Concours" },
            { label: "Nouveau" },
          ]}
        />
      }
    >
      <p className="mb-5 max-w-2xl text-sm text-ink-soft">
        Les questions s&apos;ajoutent après la création. Le nombre de questions
        annoncé aux candidats suit automatiquement la banque de questions.
      </p>

      <ContestForm
        contest={{
          title: "",
          slug: "",
          mode: "ENTRAINEMENT",
          instructions: DEFAULT_INSTRUCTIONS,
          information: "",
          secondsPerQuestion: 30,
          edition: new Date().getFullYear(),
          isActive: true,
          startsAt: "",
          opensAt: "",
          closesAt: "",
        }}
      />
    </AdminShell>
  );
}
