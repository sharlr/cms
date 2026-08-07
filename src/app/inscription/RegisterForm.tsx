"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  Checkbox,
  Field,
  FormError,
  Select,
  SubmitButton,
  TextInput,
} from "@/components/Field";
import { registerAction, type FormState } from "@/app/actions/auth";
import { CITIES, CITY_LABEL, GENDERS, GENDER_LABEL } from "@/lib/labels";
import { EducationLevelFields } from "./EducationLevelFields";

const initialState: FormState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};

  return (
    <form
      key={state.submissionId ?? "initial"}
      action={formAction}
      className="space-y-5"
      noValidate
    >
      <FormError message={state.error} />

      <fieldset className="space-y-4">
        <legend className="mb-3 text-xs font-bold tracking-[0.16em] text-brand-600 uppercase">
          Identité
        </legend>

        <Field label="Nom et prénom" htmlFor="fullName" error={errors.fullName}>
          <TextInput
            id="fullName"
            name="fullName"
            defaultValue={values.fullName}
            autoComplete="name"
            required
            error={errors.fullName}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sexe" htmlFor="gender" error={errors.gender}>
            <Select
              id="gender"
              name="gender"
              required
              defaultValue={values.gender ?? ""}
              error={errors.gender}
            >
              <option value="" disabled>
                Sélectionnez…
              </option>
              {GENDERS.map((gender) => (
                <option key={gender} value={gender}>
                  {GENDER_LABEL[gender]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Date de naissance" htmlFor="birthDate" error={errors.birthDate}>
            <TextInput
              id="birthDate"
              name="birthDate"
              defaultValue={values.birthDate}
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              required
              error={errors.birthDate}
            />
          </Field>
        </div>

        <Field label="Ville" htmlFor="city" error={errors.city}>
          <Select
            id="city"
            name="city"
            required
            defaultValue={values.city ?? ""}
            error={errors.city}
          >
            <option value="" disabled>
              Sélectionnez…
            </option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {CITY_LABEL[city]}
              </option>
            ))}
          </Select>
        </Field>

        <EducationLevelFields
          key={values.educationLevel ?? ""}
          defaultLevel={values.educationLevel ?? ""}
          defaultOther={values.otherLevel}
          levelError={errors.educationLevel}
          otherError={errors.otherLevel}
        />
      </fieldset>

      <fieldset className="space-y-4 border-t border-hairline pt-5">
        <legend className="mb-3 text-xs font-bold tracking-[0.16em] text-brand-600 uppercase">
          Contact et accès
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Numéro de téléphone" htmlFor="phone" error={errors.phone}>
            <TextInput
              id="phone"
              name="phone"
              defaultValue={values.phone}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              required
              error={errors.phone}
            />
          </Field>

          <Field label="Adresse e-mail" htmlFor="email" error={errors.email}>
            <TextInput
              id="email"
              name="email"
              defaultValue={values.email}
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              error={errors.email}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Mot de passe"
            htmlFor="password"
            error={errors.password}
            hint="8 caractères minimum."
          >
            <TextInput
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              error={errors.password}
            />
          </Field>

          <Field
            label="Confirmer le mot de passe"
            htmlFor="confirmPassword"
            error={errors.confirmPassword}
          >
            <TextInput
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              error={errors.confirmPassword}
            />
          </Field>
        </div>
      </fieldset>

      <Checkbox
        id="acceptedTerms"
        name="acceptedTerms"
        defaultChecked={values.acceptedTerms === "on"}
        error={errors.acceptedTerms}
        label={
          <>
            J&apos;accepte le{" "}
            <Link href="/reglement" className="font-semibold text-brand-600 underline">
              règlement du concours
            </Link>{" "}
            et les conditions d&apos;utilisation.
          </>
        }
      />

      <SubmitButton pending={pending} variant="gold">
        Créer mon compte
      </SubmitButton>
    </form>
  );
}
