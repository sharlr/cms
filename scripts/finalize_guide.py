"""Assemble la couverture et le corps en un seul PDF, puis nettoie les rushes."""

from __future__ import annotations

import sys
from pathlib import Path

from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
COVER = DOCS / ".cover.pdf"
BODY = DOCS / ".body.pdf"
DRAFT = DOCS / ".draft.pdf"
OUTPUT = DOCS / "Guide-utilisateur-Concours-National-de-Logique.pdf"


def main() -> int:
    for part in (COVER, BODY):
        if not part.exists():
            print(f"Fichier manquant : {part}", file=sys.stderr)
            return 1

    writer = PdfWriter()
    for part in (COVER, BODY):
        for page in PdfReader(str(part)).pages:
            writer.add_page(page)

    writer.add_metadata(
        {
            "/Title": "Guide utilisateur — Concours National de Logique",
            "/Author": "Association organisatrice du Concours National de Logique",
            "/Subject": "Manuel des modules Candidat et Administration",
            "/Keywords": "concours, logique, Djibouti, guide, candidat, administration",
        }
    )

    with open(OUTPUT, "wb") as handle:
        writer.write(handle)

    for rush in (COVER, BODY, DRAFT):
        rush.unlink(missing_ok=True)

    size_mb = OUTPUT.stat().st_size / 1_048_576
    print(f"PDF final : {OUTPUT.name} — {len(writer.pages)} pages, {size_mb:.1f} Mo")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
