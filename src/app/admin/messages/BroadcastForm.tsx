"use client";

import { useActionState, useState } from "react";
import {
  Field,
  FormError,
  FormSuccess,
  Select,
  SubmitButton,
  Textarea,
  TextInput,
} from "@/components/Field";
import { broadcastAction } from "@/app/admin/content-actions";
import type { AdminState } from "@/app/admin/actions";

const initialState: AdminState = {};

export function BroadcastForm({
  contests,
}: {
  contests: { id: string; title: string }[];
}) {
  const [state, formAction, pending] = useActionState(broadcastAction, initialState);
  const [audience, setAudience] = useState("ALL");
  const errors = state.fieldErrors ?? {};

  return (
    <form key={state.ok ?? "form"} action={formAction} className="max-w-2xl space-y-5">
      <FormError message={state.error} />
      <FormSuccess message={state.ok} />

      <Field label="Titre du message" htmlFor="title" error={errors.title}>
        <TextInput
          id="title"
          name="title"
          required
          placeholder="Rappel : le concours de sélection a lieu demain"
          error={errors.title}
        />
      </Field>

      <Field label="Message" htmlFor="body" error={errors.body}>
        <Textarea id="body" name="body" rows={7} required error={errors.body} />
      </Field>

      <Field
        label="Lien (facultatif)"
        htmlFor="linkUrl"
        error={errors.linkUrl}
        hint="Par exemple /actualites ou /accueil."
      >
        <TextInput id="linkUrl" name="linkUrl" placeholder="/actualites" error={errors.linkUrl} />
      </Field>

      <Field label="Destinataires" htmlFor="audience" error={errors.audience}>
        <Select
          id="audience"
          name="audience"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
        >
          <option value="ALL">Tous les candidats inscrits</option>
          <option value="NOT_STARTED">Ceux qui n&apos;ont pas encore passé un concours</option>
          <option value="FINISHED">Ceux qui ont terminé un concours</option>
        </Select>
      </Field>

      {audience !== "ALL" ? (
        <Field label="Concours concerné" htmlFor="contestId" error={errors.contestId}>
          <Select id="contestId" name="contestId" defaultValue="" error={errors.contestId}>
            <option value="" disabled>
              Sélectionnez…
            </option>
            {contests.map((contest) => (
              <option key={contest.id} value={contest.id}>
                {contest.title}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <SubmitButton pending={pending} variant="gold">
        Envoyer le message
      </SubmitButton>

      <p className="text-xs leading-relaxed text-ink-faint">
        Le message est déposé dans l&apos;application de chaque destinataire. Un courriel
        jumeau est envoyé si un service d&apos;envoi est configuré
        (<code className="rounded bg-surface-sunken px-1">MAIL_WEBHOOK_URL</code>) ; sinon
        seul le message dans l&apos;application est délivré.
      </p>
    </form>
  );
}
