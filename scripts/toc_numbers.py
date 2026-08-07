"""Renseigne les numéros de page réels du sommaire de `docs/guide.html`.

Lit le brouillon `docs/.draft.pdf`, retrouve la page où apparaît chaque titre de
section, puis réécrit les valeurs du sommaire. Sans cette étape, les numéros
seraient saisis à la main et se décaleraient au moindre ajout de contenu.
"""

from __future__ import annotations

import html
import io
import re
import sys
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
GUIDE = ROOT / "docs" / "guide.html"
DRAFT = ROOT / "docs" / ".draft.pdf"

ROW = re.compile(
    r'(<div class="toc-row"><span class="num">)([^<]+)(</span><span>)([^<]+)'
    r'(</span><span class="dots"></span><span class="pg">)(\d+)(</span></div>)'
)


def normalise(text: str) -> str:
    """Espaces insécables, ligatures d'apostrophe et blancs multiples aplanis."""
    text = text.replace(" ", " ").replace("’", "'")
    return re.sub(r"\s+", " ", text).strip()


def main() -> int:
    if not DRAFT.exists():
        print(f"Brouillon introuvable : {DRAFT}", file=sys.stderr)
        return 1

    pages = [normalise(page.extract_text() or "") for page in PdfReader(str(DRAFT)).pages]
    source = io.open(GUIDE, encoding="utf-8").read()

    # Le sommaire contient lui-même tous les intitulés : la recherche doit
    # commencer après lui, sinon chaque entrée pointerait sur la page du sommaire.
    marker = normalise("Ce guide couvre les deux façons d'utiliser")
    first_content = next(
        (index for index, text in enumerate(pages, start=1) if marker in text), None
    )
    if first_content is None:
        print("Repère de début du contenu introuvable.", file=sys.stderr)
        return 1

    missing: list[str] = []

    def resolve(match: re.Match[str]) -> str:
        num = normalise(html.unescape(match.group(2)))
        label = normalise(html.unescape(match.group(4)))

        # Les titres de section s'écrivent « 2.5 Répondre aux questions ».
        needle = normalise(f"{num} {label}")
        for index, text in enumerate(pages, start=1):
            if index >= first_content and needle in text:
                return f"{match.group(1)}{match.group(2)}{match.group(3)}{match.group(4)}{match.group(5)}{index}{match.group(7)}"

        missing.append(needle)
        return match.group(0)

    patched, count = ROW.subn(resolve, source)

    if missing:
        print("Sections introuvables dans le brouillon :", file=sys.stderr)
        for item in missing:
            print(f"  - {item}", file=sys.stderr)
        return 1

    io.open(GUIDE, "w", encoding="utf-8").write(patched)
    print(f"Sommaire : {count} entrées mises à jour.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
