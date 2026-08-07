/**
 * Rend quelques pages du PDF en PNG pour relecture visuelle.
 * Utilise le lecteur PDF intégré à Chrome, aucune dépendance supplémentaire.
 */
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = process.cwd();
const PDF = path.join(ROOT, "docs", "Guide-utilisateur-Concours-National-de-Logique.pdf");
const OUT = path.join(ROOT, "docs", "preview");

const PAGES = (process.argv[2] ?? "1,2,3,8,14,20,27,33,41")
  .split(",")
  .map((n) => Number(n.trim()))
  .filter(Boolean);

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
].find((p) => existsSync(p));

async function main() {
  if (!CHROME) throw new Error("Chrome introuvable.");

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 1273, deviceScaleFactor: 1.4 });

  for (const n of PAGES) {
    await page.goto(`${pathToFileURL(PDF).href}#page=${n}&zoom=page-fit&toolbar=0`, {
      waitUntil: "networkidle0",
    });
    await new Promise((r) => setTimeout(r, 1800));
    await page.screenshot({ path: path.join(OUT, `page-${String(n).padStart(2, "0")}.png`) as `${string}.png` });
    console.log(`  ✓ page ${n}`);
  }

  await browser.close();
  console.log(`Aperçus dans ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
