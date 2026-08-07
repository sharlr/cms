"use client";

import { useActionState } from "react";
import { Field, FormError, SubmitButton, TextInput } from "@/components/Field";
import { adminLoginAction, type FormState } from "@/app/actions/auth";

const initialState: FormState = {};

export function ContestAdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminLoginAction, initialState);

  return (
    <form key={state.submissionId ?? "initial"} action={formAction} className="space-y-5">
      <FormError message={state.error} />

      <Field
        label="Email"
        htmlFor="login"
        error={state.fieldErrors?.login}
      >
        <TextInput
          id="login"
          name="login"
          defaultValue={state.values?.login}
          autoComplete="email"
          type="email"
          required
        />
      </Field>

      <Field label="Password" htmlFor="password" error={state.fieldErrors?.password}>
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      <SubmitButton pending={pending}>Login as Contest Admin</SubmitButton>
    </form>
  );
}
