"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  Checkbox,
  Field,
  FormError,
  SubmitButton,
  Textarea,
  TextInput,
} from "@/components/Field";
import { saveNewsAction } from "@/app/admin/content-actions";
import type { AdminState } from "@/app/admin/actions";

const initialState: AdminState = {};

export type NewsFormValues = {
  id?: string;
  title: string;
  body: string;
  imageUrl: string;
  videoUrl: string;
  isPinned: boolean;
  published: boolean;
};

export function NewsForm({ news }: { news: NewsFormValues }) {
  const [state, formAction, pending] = useActionState(saveNewsAction, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {news.id ? <input type="hidden" name="newsId" value={news.id} /> : null}
      <FormError message={state.error} />

      <Field label="Titre" htmlFor="title" error={errors.title}>
        <TextInput id="title" name="title" defaultValue={news.title} required error={errors.title} />
      </Field>

      <Field
        label="Contenu"
        htmlFor="body"
        error={errors.body}
        hint="Une ligne vide sépare deux paragraphes. Une ligne commençant par « - » devient une puce."
      >
        <Textarea id="body" name="body" rows={10} defaultValue={news.body} required error={errors.body} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Image (URL, facultatif)"
          htmlFor="imageUrl"
          error={errors.imageUrl}
          hint="Affiche ou photo illustrant l'annonce."
        >
          <TextInput
            id="imageUrl"
            name="imageUrl"
            defaultValue={news.imageUrl}
            placeholder="https://…"
            error={errors.imageUrl}
          />
        </Field>

        <Field label="Vidéo (URL, facultatif)" htmlFor="videoUrl" error={errors.videoUrl}>
          <TextInput
            id="videoUrl"
            name="videoUrl"
            defaultValue={news.videoUrl}
            placeholder="https://…"
            error={errors.videoUrl}
          />
        </Field>
      </div>

      <div className="space-y-3 rounded-2xl border border-hairline bg-surface-2 p-4">
        <Checkbox
          id="publish"
          name="publish"
          defaultChecked={news.published}
          label="Publier — l'annonce apparaît immédiatement sur l'accueil et dans les actualités."
        />
        <Checkbox
          id="isPinned"
          name="isPinned"
          defaultChecked={news.isPinned}
          label="Épingler à la une — l'annonce reste en tête du fil."
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <SubmitButton pending={pending}>
            {news.id ? "Enregistrer l'actualité" : "Publier l'actualité"}
          </SubmitButton>
        </div>
        <Link href="/admin/actualites" className="text-sm font-semibold text-ink-soft underline">
          Annuler
        </Link>
      </div>
    </form>
  );
}
