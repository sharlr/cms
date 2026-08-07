"use client";

import { useActionState } from "react";
import { Field, FormError, FormSuccess, SubmitButton, TextInput } from "@/components/Field";
import { savePartnerAction } from "@/app/admin/content-actions";
import type { AdminState } from "@/app/admin/actions";

const initialState: AdminState = {};

export function PartnerForm({ nextPosition }: { nextPosition: number }) {
  const [state, formAction, pending] = useActionState(savePartnerAction, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form
      key={state.ok ?? "form"}
      action={formAction}
      className="space-y-4"
    >
      <FormError message={state.error} />
      <FormSuccess message={state.ok} />

      <Field label="Nom du partenaire" htmlFor="name" error={errors.name}>
        <TextInput id="name" name="name" required error={errors.name} />
      </Field>

      <Field
        label="Logo (URL, facultatif)"
        htmlFor="logoUrl"
        error={errors.logoUrl}
        hint="Sans logo, le nom du partenaire est affiché."
      >
        <TextInput id="logoUrl" name="logoUrl" placeholder="https://…" error={errors.logoUrl} />
      </Field>

      <Field label="Site web (facultatif)" htmlFor="websiteUrl" error={errors.websiteUrl}>
        <TextInput
          id="websiteUrl"
          name="websiteUrl"
          placeholder="https://…"
          error={errors.websiteUrl}
        />
      </Field>

      <Field label="Ordre d'affichage" htmlFor="position" error={errors.position}>
        <TextInput
          id="position"
          name="position"
          type="number"
          min={0}
          max={999}
          defaultValue={nextPosition}
          required
          error={errors.position}
        />
      </Field>

      <SubmitButton pending={pending}>Ajouter le partenaire</SubmitButton>
    </form>
  );
}
