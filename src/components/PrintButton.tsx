"use client";

import { Button } from "@/components/Button";

/** Déclenche la boîte d'impression du navigateur (« Enregistrer en PDF »). */
export function PrintButton({ children = "Imprimer / Enregistrer en PDF" }: { children?: React.ReactNode }) {
  return (
    <Button type="button" variant="gold" size="sm" onClick={() => window.print()}>
      {children}
    </Button>
  );
}
