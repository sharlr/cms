"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Field, FormError, Select, SubmitButton, Textarea, TextInput } from "@/components/Field";
import { saveQuestionAction, type AdminState } from "@/app/admin/actions";

const initialState: AdminState = {};

const LABELS = ["A", "B", "C", "D"] as const;

export type QuestionFormValues = {
  id?: string;
  body: string;
  type: string;
  points: number;
  choices: Record<string, string>;
  correctLabel: string;
  correctText: string;
  explanation: string;
};

export function QuestionForm({
  contestId,
  question,
}: {
  contestId: string;
  question: QuestionFormValues;
}) {
  const [state, formAction, pending] = useActionState(saveQuestionAction, initialState);
  const [type, setType] = useState(question.type);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <input type="hidden" name="contestId" value={contestId} />
      {question.id ? <input type="hidden" name="questionId" value={question.id} /> : null}
      <FormError message={state.error} />

      <Field label="Énoncé" htmlFor="body" error={errors.body}>
        <Textarea
          id="body"
          name="body"
          rows={3}
          required
          defaultValue={question.body}
          error={errors.body}
        />
      </Field>

      <Field label="Type de question" htmlFor="type" error={errors.type}>
        <Select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          error={errors.type}
        >
          <option value="QCM">QCM — quatre propositions, une seule correcte</option>
          <option value="LIBRE">Réponse libre — le candidat saisit sa réponse</option>
        </Select>
      </Field>

      {type === "QCM" ? (
        <fieldset className="space-y-3 rounded-2xl border border-hairline bg-surface-2 p-4">
          <legend className="px-1 text-sm font-semibold text-ink">
            Propositions
          </legend>

          {LABELS.map((label) => (
            <Field
              key={label}
              label={`Proposition ${label}`}
              htmlFor={`choice${label}`}
              error={errors[`choice${label}`]}
            >
              <TextInput
                id={`choice${label}`}
                name={`choice${label}`}
                defaultValue={question.choices[label] ?? ""}
                error={errors[`choice${label}`]}
              />
            </Field>
          ))}

          <Field label="Bonne réponse" htmlFor="correctLabel" error={errors.correctLabel}>
            <Select
              id="correctLabel"
              name="correctLabel"
              defaultValue={question.correctLabel}
              error={errors.correctLabel}
            >
              <option value="">Sélectionnez…</option>
              {LABELS.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </fieldset>
      ) : (
        <Field
          label="Réponse attendue"
          htmlFor="correctText"
          error={errors.correctText}
        >
          <TextInput
            id="correctText"
            name="correctText"
            defaultValue={question.correctText}
            error={errors.correctText}
          />
          <p className="mt-1 text-xs text-ink-faint">
            Séparez plusieurs formulations acceptées par «&nbsp;|&nbsp;», par exemple
            <code className="mx-1 rounded bg-surface-sunken px-1">15 | quinze</code>. La casse,
            les accents et la ponctuation sont ignorés à la correction ; seule la première
            formulation est montrée au candidat.
          </p>
        </Field>
      )}

      <Field label="Points" htmlFor="points" error={errors.points}>
        <TextInput
          id="points"
          name="points"
          type="number"
          min={1}
          max={100}
          defaultValue={question.points}
          required
          error={errors.points}
        />
      </Field>

      <Field
        label="Explication (facultatif, usage interne)"
        htmlFor="explanation"
        error={errors.explanation}
      >
        <Textarea
          id="explanation"
          name="explanation"
          rows={2}
          defaultValue={question.explanation}
          error={errors.explanation}
        />
      </Field>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <SubmitButton pending={pending}>
            {question.id ? "Enregistrer la question" : "Ajouter la question"}
          </SubmitButton>
        </div>
        <Link
          href={`/admin/concours/${contestId}`}
          className="text-sm font-medium text-ink-soft underline"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}
