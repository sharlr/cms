import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { getRankingWithUsers } from "@/lib/ranking";
import { ExcelJS, styleHeader, workbookResponse, zebra } from "@/lib/excel";
import { CITY_LABEL, GENDER_LABEL, levelText } from "@/lib/labels";

/**
 * Export Excel des résultats d'un concours.
 *
 * Colonnes et tri imposés par le cahier des charges : nom, sexe, date de
 * naissance, niveau scolaire, téléphone, e-mail, bonnes réponses, score sur 20,
 * temps total et classement général, du meilleur au moins bon.
 */
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/admin/concours/[id]/participants/export">,
) {
  await requireAdmin();
  const { id } = await ctx.params;

  const contest = await prisma.contest.findUnique({
    where: { id },
    select: { slug: true, title: true, edition: true, questionCount: true },
  });
  if (!contest) return new Response("Concours introuvable.", { status: 404 });

  const ranking = await getRankingWithUsers(id);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Concours National de Logique";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Résultats", {
    pageSetup: { orientation: "landscape", fitToPage: true },
  });

  sheet.columns = [
    { header: "Classement général", key: "rank", width: 18 },
    { header: "Nom et prénom", key: "fullName", width: 28 },
    { header: "Sexe", key: "gender", width: 11 },
    { header: "Date de naissance", key: "birthDate", width: 18 },
    { header: "Niveau scolaire", key: "level", width: 16 },
    { header: "Ville", key: "city", width: 16 },
    { header: "Téléphone", key: "phone", width: 16 },
    { header: "Adresse e-mail", key: "email", width: 30 },
    { header: "Nombre de bonnes réponses", key: "correct", width: 26 },
    { header: `Score (/${contest.questionCount})`, key: "score", width: 14 },
    { header: "Fausses réponses", key: "wrong", width: 18 },
    { header: "Non répondues", key: "unanswered", width: 16 },
    { header: "Temps total de réponse", key: "totalTime", width: 22 },
  ];

  for (const row of ranking) {
    sheet.addRow({
      rank: row.rank,
      fullName: row.user.fullName,
      gender: GENDER_LABEL[row.user.gender],
      birthDate: row.user.birthDate,
      level: levelText(row.user.educationLevel, row.user.otherLevel),
      city: CITY_LABEL[row.user.city],
      phone: row.user.phone,
      email: row.user.email,
      correct: row.correctCount,
      score: `${row.correctCount}/${contest.questionCount}`,
      wrong: row.wrongCount,
      unanswered: row.unansweredCount,
      // Durée réelle : Excel l'affiche en [h]:mm:ss et sait la totaliser.
      totalTime: row.totalTimeMs / 86_400_000,
    });
  }

  sheet.getColumn("birthDate").numFmt = "dd/mm/yyyy";
  sheet.getColumn("totalTime").numFmt = "[h]:mm:ss";
  sheet.getColumn("rank").alignment = { horizontal: "center" };

  styleHeader(sheet);
  zebra(sheet);

  const filename = `resultats-${contest.slug}-${contest.edition}.xlsx`;
  return workbookResponse(workbook, filename);
}
