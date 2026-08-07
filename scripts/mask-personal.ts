/**
 * Masque temporairement les comptes réels avant les captures du guide, puis les
 * rétablit à l'identique.
 *
 *   npx tsx scripts/mask-personal.ts mask
 *   npx tsx scripts/mask-personal.ts restore
 *
 * Les valeurs d'origine sont mises de côté dans `scripts/.personal-backup.json`.
 * Aucun compte n'est supprimé : seuls le nom, le courriel et le téléphone
 * affichés sont remplacés le temps de produire la documentation.
 */
import "dotenv/config";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }),
});

const BACKUP = path.resolve(process.cwd(), "scripts", ".personal-backup.json");

/** Comptes de démonstration créés par les scripts : à ne pas masquer. */
const SYNTHETIC = /(@example\.com|@concourslogique\.org|demo-guide)/i;

const REPLACEMENTS = [
  { fullName: "Nasra Ibrahim", email: "nasra.candidate@example.com", phone: "+253770101" },
  { fullName: "Kadar Waberi", email: "kadar.candidate@example.com", phone: "+253770102" },
  { fullName: "Iman Bouh", email: "iman.candidate@example.com", phone: "+253770103" },
];

type Saved = { id: string; fullName: string; email: string; phone: string };

async function mask() {
  const real = (await prisma.user.findMany({ orderBy: { createdAt: "asc" } })).filter(
    (u) => !SYNTHETIC.test(u.email),
  );

  if (real.length === 0) {
    console.log("Aucun compte réel à masquer.");
    return;
  }
  if (real.length > REPLACEMENTS.length) {
    throw new Error(`Trop de comptes réels (${real.length}) pour les pseudonymes disponibles.`);
  }

  const saved: Saved[] = real.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
  }));
  writeFileSync(BACKUP, JSON.stringify(saved, null, 2), "utf8");

  for (const [index, user] of real.entries()) {
    await prisma.user.update({ where: { id: user.id }, data: REPLACEMENTS[index] });
    console.log(`  masqué : ${user.fullName} → ${REPLACEMENTS[index].fullName}`);
  }
  console.log(`Sauvegarde : ${BACKUP}`);
}

async function restore() {
  if (!existsSync(BACKUP)) {
    console.log("Rien à rétablir.");
    return;
  }

  const saved = JSON.parse(readFileSync(BACKUP, "utf8")) as Saved[];
  for (const user of saved) {
    await prisma.user.update({
      where: { id: user.id },
      data: { fullName: user.fullName, email: user.email, phone: user.phone },
    });
    console.log(`  rétabli : ${user.fullName} (${user.email})`);
  }

  rmSync(BACKUP, { force: true });
}

async function main() {
  const mode = process.argv[2];
  if (mode === "mask") await mask();
  else if (mode === "restore") await restore();
  else throw new Error("Usage : mask-personal.ts mask|restore");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
