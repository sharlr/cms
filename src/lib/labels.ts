import type { City, ContestMode, EducationLevel, Gender } from "@/generated/prisma";

/* Libellés français des énumérations, partagés par les formulaires, les
   tableaux d'administration et les exports. */

export const CITY_LABEL: Record<City, string> = {
  DJIBOUTI_VILLE: "Djibouti-ville",
  TADJOURAH: "Tadjourah",
  DIKHIL: "Dikhil",
  ARTA: "Arta",
  ALI_SABIEH: "Ali Sabieh",
};

export const CITIES = Object.keys(CITY_LABEL) as City[];

export const LEVEL_LABEL: Record<EducationLevel, string> = {
  PRIMAIRE: "Primaire",
  COLLEGE: "Collège",
  LYCEE: "Lycée",
  UNIVERSITE: "Université",
  AUTRE: "Autre",
};

export const LEVELS = Object.keys(LEVEL_LABEL) as EducationLevel[];

export const GENDER_LABEL: Record<Gender, string> = {
  MASCULIN: "Masculin",
  FEMININ: "Féminin",
};

export const GENDERS = Object.keys(GENDER_LABEL) as Gender[];

export const MODE_LABEL: Record<ContestMode, string> = {
  ENTRAINEMENT: "Entrainement",
  SELECTION: "Concours de sélection",
};

/** Niveau scolaire affiché, en tenant compte du champ libre « Autre ». */
export function levelText(level: EducationLevel, otherLevel?: string | null) {
  if (level === "AUTRE" && otherLevel) return otherLevel;
  return LEVEL_LABEL[level];
}

export const SLOGAN = "Soyons logiques !";
export const TAGLINE = "Observez bien… la logique est partout !";
export const PITCH =
  "Participez au Concours National de Logique et tentez de remporter de nombreux prix !";
