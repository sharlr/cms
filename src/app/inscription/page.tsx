import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/AuthLayout";
import { getSessionUserId } from "@/lib/auth";
import { RegisterForm } from "./RegisterForm";

export const metadata = { title: "Inscription" };

const BENEFITS = [
  "Un entraînement illimité, disponible toute l'année.",
  "Une place au concours de sélection national.",
  "Un certificat de participation pour les sélectionnés.",
];

export default async function InscriptionPage() {
  if (await getSessionUserId()) redirect("/accueil");

  return (
    <AuthLayout
      title="Créer mon compte"
      subtitle="L'inscription est obligatoire pour accéder à l'entraînement et au concours de sélection. Un seul compte par candidat."
      footer={
        <>
          Déjà inscrit&nbsp;?{" "}
          <Link href="/connexion" className="font-semibold text-brand-600 underline">
            Se connecter
          </Link>
        </>
      }
      aside={
        <ul className="space-y-3">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3 text-white/80">
              <span
                aria-hidden="true"
                className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-gold-400/25 text-xs text-gold-200"
              >
                ✓
              </span>
              {benefit}
            </li>
          ))}
        </ul>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
