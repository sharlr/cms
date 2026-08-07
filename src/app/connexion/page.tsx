import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/AuthLayout";
import { getSessionUserId } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Connexion" };

export default async function ConnexionPage() {
  if (await getSessionUserId()) redirect("/accueil");

  return (
    <AuthLayout
      title="Se connecter"
      subtitle="Accédez à votre espace pour vous entraîner et passer le concours de sélection."
      footer={
        <>
          Pas encore de compte&nbsp;?{" "}
          <Link href="/inscription" className="font-semibold text-brand-600 underline">
            S&apos;inscrire au concours
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
