"use client";

import { useActionState } from "react";
import { Field, FormError, SubmitButton, TextInput } from "@/components/Field";
import { loginAction, type FormState } from "@/app/actions/auth";

const initialState: FormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form key={state.submissionId ?? "initial"} action={formAction} className="space-y-5">
      <FormError message={state.error} />

      <Field
        label="Adresse e-mail ou téléphone"
        htmlFor="login"
        error={state.fieldErrors?.login}
      >
        <TextInput
          id="login"
          name="login"
          defaultValue={state.values?.login}
          autoComplete="username"
          required
        />
      </Field>

      <Field label="Mot de passe" htmlFor="password" error={state.fieldErrors?.password}>
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      <SubmitButton pending={pending}>Se connecter</SubmitButton>
    </form>
  );
}
