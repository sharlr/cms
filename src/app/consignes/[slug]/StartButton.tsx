"use client";

import { useActionState } from "react";
import { FormError } from "@/components/Field";
import { Button } from "@/components/Button";
import { startAttemptAction, type StartState } from "@/app/actions/attempt";
import { SLOGAN } from "@/lib/labels";

const initialState: StartState = {};

export function StartButton({ slug, disabled = false }: { slug: string; disabled?: boolean }) {
  const [state, formAction, pending] = useActionState(startAttemptAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <FormError message={state.error} />
      <input type="hidden" name="slug" value={slug} />
      <Button type="submit" disabled={pending || disabled} variant="gold" size="lg" block>
        {pending ? "Préparation…" : `Commençons — ${SLOGAN}`}
      </Button>
    </form>
  );
}
