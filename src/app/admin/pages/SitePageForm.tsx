"use client";

import { useActionState } from "react";
import { Field, FormError, FormSuccess, SubmitButton, Textarea, TextInput } from "@/components/Field";
import { saveSitePageAction } from "@/app/admin/content-actions";
import type { AdminState } from "@/app/admin/actions";

const initialState: AdminState = {};

export function SitePageForm({
  slug,
  title,
  body,
}: {
  slug: string;
  title: string;
  body: string;
}) {
  const [state, formAction, pending] = useActionState(saveSitePageAction, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="slug" value={slug} />
      <FormError message={state.error} />
      <FormSuccess message={state.ok} />

      <Field label="Titre de la page" htmlFor={`title-${slug}`} error={errors.title}>
        <TextInput id={`title-${slug}`} name="title" defaultValue={title} required error={errors.title} />
      </Field>

      <Field
        label="Contenu"
        htmlFor={`body-${slug}`}
        error={errors.body}
        hint="Une ligne vide sépare deux paragraphes. Une ligne commençant par « - » devient une puce."
      >
        <Textarea
          id={`body-${slug}`}
          name="body"
          rows={16}
          defaultValue={body}
          required
          error={errors.body}
        />
      </Field>

      <SubmitButton pending={pending} block={false} size="md">
        Enregistrer la page
      </SubmitButton>
    </form>
  );
}
