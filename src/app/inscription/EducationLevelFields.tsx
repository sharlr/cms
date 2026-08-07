"use client";

import { useState } from "react";
import { Field, Select, TextInput } from "@/components/Field";

/**
 * Niveau scolaire + champ « Autre — précisez » conditionnel.
 *
 * Le composant est monté avec une `key` égale au niveau renvoyé par le serveur :
 * quand React réinitialise le formulaire après une action, le remontage
 * réapplique la valeur ressaisie sans avoir à synchroniser l'état dans un effet.
 */
export function EducationLevelFields({
  defaultLevel,
  defaultOther,
  levelError,
  otherError,
}: {
  defaultLevel: string;
  defaultOther?: string;
  levelError?: string;
  otherError?: string;
}) {
  const [level, setLevel] = useState(defaultLevel);

  return (
    <>
      <Field label="Niveau scolaire" htmlFor="educationLevel" error={levelError}>
        <Select
          id="educationLevel"
          name="educationLevel"
          required
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          error={levelError}
        >
          <option value="" disabled>
            Sélectionnez…
          </option>
          <option value="PRIMAIRE">Primaire</option>
          <option value="COLLEGE">Collège</option>
          <option value="LYCEE">Lycée</option>
          <option value="UNIVERSITE">Université</option>
          <option value="AUTRE">Autre</option>
        </Select>
      </Field>

      {level === "AUTRE" ? (
        <Field label="Autre — précisez" htmlFor="otherLevel" error={otherError}>
          <TextInput
            id="otherLevel"
            name="otherLevel"
            defaultValue={defaultOther}
            error={otherError}
          />
        </Field>
      ) : null}
    </>
  );
}
