"use client";

import { useActionState } from "react";
import { Field, FormError, TextInput } from "@/components/Field";
import { deleteContestAction, type AdminState } from "@/app/admin/actions";

const initialState: AdminState = {};

export function DeleteContest({
  contestId,
  slug,
  questionCount,
  attemptCount,
}: {
  contestId: string;
  slug: string;
  questionCount: number;
  attemptCount: number;
}) {
  const [state, formAction, pending] = useActionState(deleteContestAction, initialState);

  return (
    <form action={formAction} className="mt-3 max-w-md space-y-3">
      <input type="hidden" name="contestId" value={contestId} />
      <FormError message={state.error} />

      <p className="text-sm text-ink-soft">
        Cette action supprime définitivement le concours, ses {questionCount} question(s)
        et les {attemptCount} participation(s) enregistrée(s).
      </p>

      <Field
        label={`Saisissez « ${slug} » pour confirmer`}
        htmlFor="confirmSlug"
        error={state.fieldErrors?.confirmSlug}
      >
        <TextInput
          id="confirmSlug"
          name="confirmSlug"
          autoComplete="off"
          placeholder={slug}
          error={state.fieldErrors?.confirmSlug}
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-ko px-3 py-2 text-sm font-semibold text-ko transition hover:bg-ko/10 disabled:opacity-60"
      >
        {pending ? "Suppression…" : "Supprimer définitivement"}
      </button>
    </form>
  );
}
