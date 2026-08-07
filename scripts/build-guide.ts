/**
 * Rend `docs/guide.html` en PDF A4 via le Chrome installé.
 *
 * Deux modes :
 *   --draft  rend le document complet dans `docs/.draft.pdf`. Ce brouillon sert
 *            uniquement à relever les numéros de page réels du sommaire.
 *   (défaut) rend la couverture et le corps séparément. La couverture est tirée
 *            à fond perdu et sans pied de page ; le corps porte la numérotation.
 *            Les deux fichiers sont ensuite assemblés par `finalize_guide.py`.
 *
 * Chrome conserve la numérotation absolue du document même lorsqu'on limite le
 * rendu à une plage de pages : le corps commence donc bien au numéro 2.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer, { type Page } from "puppeteer-core";

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, "docs", "guide.html");
const DRAFT = path.join(ROOT, "docs", ".draft.pdf");
const COVER = path.join(ROOT, "docs", ".cover.pdf");
const BODY = path.join(ROOT, "docs", ".body.pdf");

const CHROME_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
];

const FOOTER = `
<style>
  #f {
    width: 100%;
    padding: 0 18mm;
    font-family: "Segoe UI", system-ui, sans-serif;
    font-size: 7.5pt;
    color: #7d86ab;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  #f .t { font-weight: 600; }
  #f .p { font-weight: 700; color: #4644dc; }
</style>
<div id="f">
  <span class="t">Concours National de Logique — Guide utilisateur</span>
  <span class="p"><span class="pageNumber"></span> / <span class="totalPages"></span></span>
</div>
`;

/** Attend que polices et captures soient décodées avant tout rendu. */
async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((img) =>
        img.complete ? Promise.resolve() : img.decode().catch(() => undefined),
      ),
    );
  });
}

async function main() {
  if (!existsSync(SOURCE)) throw new Error(`Introuvable : ${SOURCE}`);

  const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!executablePath) throw new Error("Aucun navigateur Chrome/Edge trouvé.");

  const draftOnly = process.argv.includes("--draft");

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--force-color-profile=srgb", "--font-render-hinting=none"],
  });

  try {
    const page = await browser.newPage();
    // Le document embarque une trentaine de captures haute densité : le délai
    // par défaut de 30 s est trop court sur une machine chargée.
    page.setDefaultNavigationTimeout(180_000);
    await page.goto(pathToFileURL(SOURCE).href, { waitUntil: "networkidle0" });
    await settle(page);

    // Les marges viennent des règles @page : `@page :first { margin: 0 }` rend
    // la couverture à fond perdu.
    const common = { format: "A4" as const, printBackground: true };

    if (draftOnly) {
      await page.pdf({
        ...common,
        path: DRAFT as `${string}.pdf`,
        displayHeaderFooter: true,
        headerTemplate: "<span></span>",
        footerTemplate: FOOTER,
      });
      console.log(`Brouillon : ${DRAFT}`);
      return;
    }

    await page.pdf({
      ...common,
      path: COVER as `${string}.pdf`,
      pageRanges: "1",
      displayHeaderFooter: false,
    });

    await page.pdf({
      ...common,
      path: BODY as `${string}.pdf`,
      pageRanges: "2-",
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: FOOTER,
    });

    console.log("Couverture et corps rendus.");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
