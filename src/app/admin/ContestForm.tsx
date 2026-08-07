"use client";

import { useActionState } from "react";
import {
  Checkbox,
  Field,
  FormError,
  FormSuccess,
  Select,
  SubmitButton,
  Textarea,
  TextInput,
} from "@/components/Field";
import { saveContestAction, type AdminState } from "@/app/admin/actions";

const initialState: AdminState = {};

export type ContestFormValues = {
  id?: string;
  title: string;
  slug: string;
  mode: string;
  instructions: string;
  information: string;
  secondsPerQuestion: number;
  edition: number;
  isActive: boolean;
  startsAt: string;
  opensAt: string;
  closesAt: string;
};

export function ContestForm({ contest }: { contest: ContestFormValues }) {
  const [state, formAction, pending] = useActionState(saveContestAction, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {contest.id ? <input type="hidden" name="contestId" value={contest.id} /> : null}
      <FormError message={state.error} />
      <FormSuccess message={state.ok} />

      <Field label="Titre" htmlFor="title" error={errors.title}>
        <TextInput
          id="title"
          name="title"
          defaultValue={contest.title}
          required
          error={errors.title}
        />
      </Field>

      <Field
        label="Identifiant d'URL (slug)"
        htmlFor="slug"
        error={errors.slug}
      >
        <TextInput
          id="slug"
          name="slug"
          defaultValue={contest.slug}
          required
          error={errors.slug}
        />
      </Field>

      <Field label="Mode" htmlFor="mode" error={errors.mode}>
        <Select id="mode" name="mode" defaultValue={contest.mode} error={errors.mode}>
          <option value="ENTRAINEMENT">Entrainement — rejouable sans limite</option>
          <option value="SELECTION">
            Concours de sélection — une seule participation
          </option>
        </Select>
      </Field>

      <Field
        label="Consignes (une règle par ligne)"
        htmlFor="instructions"
        error={errors.instructions}
      >
        <Textarea
          id="instructions"
          name="instructions"
          rows={9}
          required
          defaultValue={contest.instructions}
          error={errors.instructions}
        />
      </Field>

      <Field
        label="Encart « Information » de l'accueil (facultatif)"
        htmlFor="information"
        error={errors.information}
      >
        <Textarea
          id="information"
          name="information"
          rows={3}
          defaultValue={contest.information}
          error={errors.information}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Secondes par question"
          htmlFor="secondsPerQuestion"
          error={errors.secondsPerQuestion}
        >
          <TextInput
            id="secondsPerQuestion"
            name="secondsPerQuestion"
            type="number"
            min={5}
            max={3600}
            defaultValue={contest.secondsPerQuestion}
            required
            error={errors.secondsPerQuestion}
          />
        </Field>

        <Field label="Édition (année)" htmlFor="edition" error={errors.edition}>
          <TextInput
            id="edition"
            name="edition"
            type="number"
            min={2000}
            max={2100}
            defaultValue={contest.edition}
            required
            error={errors.edition}
          />
        </Field>
      </div>

      <Field
        label="Heure officielle de l'épreuve (facultatif)"
        htmlFor="startsAt"
        error={errors.startsAt}
        hint="Avant cette heure, le bouton reste verrouillé et un compte à rebours s'affiche. Il s'active automatiquement à l'heure dite."
      >
        <TextInput
          id="startsAt"
          name="startsAt"
          type="datetime-local"
          defaultValue={contest.startsAt}
          error={errors.startsAt}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ouverture (facultatif)" htmlFor="opensAt" error={errors.opensAt}>
          <TextInput
            id="opensAt"
            name="opensAt"
            type="datetime-local"
            defaultValue={contest.opensAt}
            error={errors.opensAt}
          />
        </Field>
        <Field label="Clôture (facultatif)" htmlFor="closesAt" error={errors.closesAt}>
          <TextInput
            id="closesAt"
            name="closesAt"
            type="datetime-local"
            defaultValue={contest.closesAt}
            error={errors.closesAt}
          />
        </Field>
      </div>

      <Checkbox
        id="isActive"
        name="isActive"
        defaultChecked={contest.isActive}
        label="Concours ouvert aux candidats"
      />

      <SubmitButton pending={pending}>
        {contest.id ? "Enregistrer les modifications" : "Créer le concours"}
      </SubmitButton>
    </form>
  );
}
