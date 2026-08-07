import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/**
 * Garde des écrans d'administration. Un candidat connecté est renvoyé vers son
 * accueil plutôt que vers la connexion : il est authentifié, simplement pas
 * autorisé.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (user.role !== "ADMIN") redirect("/accueil");
  return user;
}
