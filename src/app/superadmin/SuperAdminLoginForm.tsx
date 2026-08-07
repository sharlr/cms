"use client";

import { useActionState } from "react";
import { Field, FormError, SubmitButton, TextInput } from "@/components/Field";
import { superAdminLoginAction, type FormState } from "@/app/actions/auth";

const initialState: FormState = {};

export function SuperAdminLoginForm() {
  const [state, formAction, pending] = useActionState(superAdminLoginAction, initialState);

  return (
    <form key={state.submissionId ?? "initial"} action={formAction} className="space-y-5">
      <FormError message={state.error} />

      <Field
        label="System Admin Username"
        htmlFor="username"
        error={state.fieldErrors?.username}
      >
        <TextInput
          id="username"
          name="username"
          defaultValue={state.values?.username}
          autoComplete="username"
          placeholder="administrator"
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

      <SubmitButton pending={pending}>Login as System Admin</SubmitButton>
    </form>
  );
}
