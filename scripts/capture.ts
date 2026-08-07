/**
 * Captures d'écran du guide utilisateur.
 *
 * Pilote le Chrome installé (via puppeteer-core) sur le serveur de
 * développement, se connecte tour à tour en candidate puis en administratrice,
 * et enregistre chaque écran en PNG haute densité dans `docs/captures/`.
 */
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import puppeteer, { type Browser, type Page } from "puppeteer-core";

const BASE = process.env.CAPTURE_BASE_URL ?? "http://localhost:3000";
const OUT = path.resolve(process.cwd(), "docs", "captures");

const CHROME_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
];

const DESKTOP = { width: 1360, height: 900, deviceScaleFactor: 2 };
const PHONE = { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true };

type Shot = {
  name: string;
  url: string;
  /** Capture la page entière plutôt que la seule fenêtre. */
  full?: boolean;
  /** Hauteur de fenêtre sur mesure, pour cadrer un écran long. */
  height?: number;
  phone?: boolean;
  /** Exécuté après chargement (ouvrir un menu, remplir un champ…). */
  prepare?: (page: Page) => Promise<void>;
};

async function login(page: Page, login: string, password: string) {
  await page.setViewport(DESKTOP);

  // Deux essais : un clic émis avant l'hydratation de React déclenche une
  // soumission native que l'action serveur ne traite pas.
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await page.goto(`${BASE}/connexion`, { waitUntil: "networkidle2" });
    if (page.url().includes("/accueil")) return;

    await page.waitForSelector("#login", { timeout: 10_000 });
    await new Promise((r) => setTimeout(r, 1200));

    await page.type("#login", login);
    await page.type("#password", password);
    await page.click('button[type="submit"]');

    try {
      // La connexion passe par une action serveur : on attend le changement
      // d'URL, l'évènement de navigation n'étant pas toujours émis.
      await page.waitForFunction(() => location.pathname === "/accueil", {
        timeout: 15_000,
      });
      await new Promise((r) => setTimeout(r, 400));
      return;
    } catch (error) {
      if (attempt === 2) throw error;
      console.log("  … nouvelle tentative de connexion");
    }
  }
}

/** Vide les cookies : plus fiable que cliquer un bouton dépendant du gabarit. */
async function logout(page: Page) {
  const client = await page.createCDPSession();
  await client.send("Network.clearBrowserCookies");
  await client.detach();
}

async function capture(page: Page, shot: Shot) {
  const viewport = shot.phone
    ? { ...PHONE, height: shot.height ?? PHONE.height }
    : { ...DESKTOP, height: shot.height ?? DESKTOP.height };
  await page.setViewport(viewport);

  await page.goto(shot.url, { waitUntil: "networkidle2" });

  // Masque l'indicateur de développement de Next.js et libère la gouttière de
  // barre de défilement : ni l'un ni l'autre n'a sa place dans une documentation.
  await page.addStyleTag({
    content: "nextjs-portal { display: none !important; } html { scrollbar-gutter: auto !important; }",
  });

  if (shot.prepare) await shot.prepare(page);

  // Laisse les polices et les dégradés se stabiliser avant la capture.
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 350));

  await page.screenshot({
    path: path.join(OUT, `${shot.name}.png`) as `${string}.png`,
    fullPage: shot.full ?? false,
  });
  console.log(`  ✓ ${shot.name}`);
}

async function run(browser: Browser) {
  const page = await browser.newPage();

  // ---------------------------------------------------------- pages publiques
  console.log("Pages publiques");
  await capture(page, { name: "01-accueil-public", url: `${BASE}/`, height: 1000 });
  await capture(page, { name: "02-accueil-public-bas", url: `${BASE}/`, full: true });
  await capture(page, { name: "03-inscription", url: `${BASE}/inscription`, height: 1180 });
  await capture(page, { name: "04-connexion", url: `${BASE}/connexion`, height: 760 });
  await capture(page, { name: "05-actualites", url: `${BASE}/actualites`, height: 900 });
  await capture(page, { name: "06-reglement", url: `${BASE}/reglement`, height: 1000 });
  await capture(page, { name: "07-recompenses", url: `${BASE}/recompenses`, height: 980 });
  await capture(page, { name: "08-contact", url: `${BASE}/contact`, height: 820 });

  // -------------------------------------------------------- parcours candidat
  console.log("Espace candidat");
  await login(page, "candidate@example.com", "demo1234");

  await capture(page, { name: "10-espace-candidat", url: `${BASE}/accueil`, height: 1000 });
  await capture(page, { name: "11-consignes", url: `${BASE}/consignes/entrainement`, height: 1120 });

  // Une tentative fraîche pour illustrer l'épreuve en cours.
  await page.goto(`${BASE}/consignes/entrainement`, { waitUntil: "networkidle2" });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    page.evaluate(() => {
      const button = [...document.querySelectorAll("button[type=submit]")].find((b) =>
        /Commençons/i.test(b.textContent ?? ""),
      );
      (button as HTMLButtonElement | undefined)?.click();
    }),
  ]);
  const attemptUrl = page.url();

  await capture(page, { name: "12-question-qcm", url: attemptUrl, height: 880 });
  await capture(page, {
    name: "13-question-qcm-selection",
    url: attemptUrl,
    height: 880,
    prepare: async (p) => {
      await p.evaluate(() => {
        const tiles = document.querySelectorAll<HTMLButtonElement>(".answer-tile");
        tiles[2]?.click();
      });
      await new Promise((r) => setTimeout(r, 250));
    },
  });

  // Question suivante : réponse libre.
  await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find((b) =>
      /Valider et passer/i.test(b.textContent ?? ""),
    );
    (button as HTMLButtonElement | undefined)?.click();
  });
  await new Promise((r) => setTimeout(r, 1600));
  await capture(page, { name: "14-question-libre", url: page.url(), height: 880 });

  // Abandon de la tentative de démonstration : les écrans de résultats
  // s'appuient sur la participation créée par le jeu de démonstration.
  await page.goto(`${BASE}/historique`, { waitUntil: "networkidle2" });

  const resultId = await page.evaluate(() => {
    const link = [...document.querySelectorAll("a")].find((a) =>
      a.getAttribute("href")?.startsWith("/resultats/"),
    );
    return link?.getAttribute("href")?.split("/")[2] ?? null;
  });

  await capture(page, { name: "15-historique", url: `${BASE}/historique`, height: 900 });

  if (resultId) {
    await capture(page, { name: "16-resultats", url: `${BASE}/resultats/${resultId}`, height: 1080 });
    await capture(page, {
      name: "17-recapitulatif",
      url: `${BASE}/resultats/${resultId}/recapitulatif`,
      height: 1000,
    });
    await capture(page, { name: "18-certificat", url: `${BASE}/certificat/${resultId}`, full: true });
  }

  await capture(page, { name: "19-classement", url: `${BASE}/classement`, height: 1000 });
  await capture(page, { name: "20-messages", url: `${BASE}/notifications`, height: 760 });

  // Vues mobiles, pour illustrer l'usage sur téléphone.
  console.log("Vues mobiles");
  await capture(page, { name: "30-mobile-espace", url: `${BASE}/accueil`, phone: true });
  await capture(page, { name: "31-mobile-question", url: attemptUrl, phone: true });
  await capture(page, {
    name: "32-mobile-menu",
    url: `${BASE}/accueil`,
    phone: true,
    prepare: async (p) => {
      await p.evaluate(() => {
        document
          .querySelector<HTMLButtonElement>('button[aria-label="Ouvrir le menu"]')
          ?.click();
      });
      await new Promise((r) => setTimeout(r, 300));
    },
  });

  // ------------------------------------------------------------ administration
  // Onglet neuf : l'émulation tactile et le minuteur de l'épreuve laissés par
  // le parcours candidat perturbent la soumission du formulaire de connexion.
  console.log("Administration");
  await page.close();
  const admin = await browser.newPage();
  await logout(admin);
  await login(admin, "admin@concourslogique.org", "admin1234");

  await capture(admin, { name: "40-admin-tableau-de-bord", url: `${BASE}/admin`, height: 1150 });
  await capture(admin, { name: "41-admin-candidats", url: `${BASE}/admin/candidats`, height: 1000 });
  await capture(admin, { name: "42-admin-concours", url: `${BASE}/admin/concours`, height: 900 });

  const contestId = await admin.evaluate(() => {
    const link = [...document.querySelectorAll("a")].find((a) =>
      /^\/admin\/concours\/[a-z0-9]+$/.test(a.getAttribute("href") ?? ""),
    );
    return link?.getAttribute("href")?.split("/")[3] ?? null;
  });

  if (contestId) {
    await capture(admin, {
      name: "43-admin-questions",
      url: `${BASE}/admin/concours/${contestId}`,
      height: 1000,
    });
    await capture(admin, {
      name: "44-admin-parametres",
      url: `${BASE}/admin/concours/${contestId}`,
      height: 1100,
      prepare: async (p) => {
        await p.evaluate(() => {
          const heading = [...document.querySelectorAll("h2")].find((h) =>
            /Paramètres/i.test(h.textContent ?? ""),
          );
          heading?.scrollIntoView({ block: "start" });
        });
        await new Promise((r) => setTimeout(r, 300));
      },
    });
    await capture(admin, {
      name: "45-admin-question-form",
      url: `${BASE}/admin/concours/${contestId}/questions/nouvelle`,
      height: 1150,
    });
    await capture(admin, {
      name: "46-admin-import",
      url: `${BASE}/admin/concours/${contestId}/questions/import`,
      height: 880,
    });
    await capture(admin, {
      name: "47-admin-participations",
      url: `${BASE}/admin/concours/${contestId}/participants`,
      height: 1000,
    });
  }

  await capture(admin, { name: "50-admin-actualites", url: `${BASE}/admin/actualites`, height: 820 });
  await capture(admin, {
    name: "51-admin-actualite-form",
    url: `${BASE}/admin/actualites/nouvelle`,
    height: 1150,
  });
  await capture(admin, { name: "52-admin-pages", url: `${BASE}/admin/pages`, height: 1000 });
  await capture(admin, { name: "53-admin-partenaires", url: `${BASE}/admin/partenaires`, height: 900 });
  await capture(admin, { name: "54-admin-messages", url: `${BASE}/admin/messages`, height: 1000 });

  await admin.close();
}

async function main() {
  const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!executablePath) throw new Error("Aucun navigateur Chrome/Edge trouvé.");

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--hide-scrollbars", "--force-color-profile=srgb", "--font-render-hinting=none"],
  });

  try {
    await run(browser);
  } finally {
    await browser.close();
  }

  console.log(`\nCaptures enregistrées dans ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
