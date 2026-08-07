"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Checkbox, FormError, SubmitButton } from "@/components/Field";
import { importQuestionsAction, type AdminState } from "@/app/admin/actions";

const initialState: AdminState = {};

export function ImportForm({ contestId }: { contestId: string }) {
  const [state, formAction, pending] = useActionState(importQuestionsAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="contestId" value={contestId} />

      <FormError message={state.error} />

      {state.details && state.details.length > 0 ? (
        <ul className="space-y-1 rounded-xl border border-ko/25 bg-ko-soft p-4 text-sm text-ko">
          {state.details.map((detail, index) => (
            <li key={index}>{detail}</li>
          ))}
        </ul>
      ) : null}

      <div>
        <label htmlFor="file" className="mb-1.5 block text-sm font-semibold text-ink">
          Classeur Excel (.xlsx)
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          required
          className="w-full cursor-pointer rounded-xl border border-hairline bg-surface-2 px-3.5 py-2.5 text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-brand-500 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-600"
        />
        <p className="mt-1.5 text-xs text-ink-faint">
          5 Mo maximum.{" "}
          <Link
            href={`/admin/concours/${contestId}/questions/import/template`}
            className="font-semibold text-brand-600 underline"
          >
            Télécharger le modèle
          </Link>
        </p>
      </div>

      <Checkbox
        id="replace"
        name="replace"
        label="Remplacer les questions existantes du concours (sinon, les nouvelles questions sont ajoutées à la suite)."
      />

      <SubmitButton pending={pending}>Importer les questions</SubmitButton>
    </form>
  );
}
