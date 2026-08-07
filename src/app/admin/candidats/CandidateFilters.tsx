"use client";

import { Select, TextInput } from "@/components/Field";
import { Button } from "@/components/Button";
import { CITIES, CITY_LABEL, LEVELS, LEVEL_LABEL } from "@/lib/labels";

/**
 * Recherche et filtres. Formulaire GET : les critères vivent dans l'URL, donc
 * la vue est partageable et le retour arrière fonctionne naturellement.
 */
export function CandidateFilters({
  search,
  level,
  city,
}: {
  search: string;
  level: string;
  city: string;
}) {
  return (
    <form method="get" className="card flex flex-wrap items-end gap-3 p-4">
      <div className="min-w-56 flex-1">
        <label htmlFor="q" className="mb-1.5 block text-sm font-semibold text-ink">
          Rechercher un candidat
        </label>
        <TextInput
          id="q"
          name="q"
          type="search"
          defaultValue={search}
          placeholder="Nom, e-mail ou téléphone"
        />
      </div>

      <div className="w-full sm:w-48">
        <label htmlFor="niveau" className="mb-1.5 block text-sm font-semibold text-ink">
          Niveau scolaire
        </label>
        <Select id="niveau" name="niveau" defaultValue={level}>
          <option value="">Tous les niveaux</option>
          {LEVELS.map((value) => (
            <option key={value} value={value}>
              {LEVEL_LABEL[value]}
            </option>
          ))}
        </Select>
      </div>

      <div className="w-full sm:w-48">
        <label htmlFor="ville" className="mb-1.5 block text-sm font-semibold text-ink">
          Ville
        </label>
        <Select id="ville" name="ville" defaultValue={city}>
          <option value="">Toutes les villes</option>
          {CITIES.map((value) => (
            <option key={value} value={value}>
              {CITY_LABEL[value]}
            </option>
          ))}
        </Select>
      </div>

      <Button type="submit" variant="brand">
        Filtrer
      </Button>
      {search || level || city ? (
        <a href="/admin/candidats" className="btn3d btn3d--ghost">
          Réinitialiser
        </a>
      ) : null}
    </form>
  );
}
