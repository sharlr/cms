import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { ExcelJS, styleHeader, workbookResponse, zebra } from "@/lib/excel";
import { CITY_LABEL, GENDER_LABEL, levelText } from "@/lib/labels";

/** Export Excel de la liste des candidats inscrits. */
export async function GET() {
  await requireAdmin();

  const candidates = await prisma.user.findMany({
    where: { role: "CANDIDATE" },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { attempts: true } },
      attempts: {
        where: { status: "TERMINEE" },
        orderBy: [{ correctCount: "desc" }, { totalTimeMs: "asc" }],
        take: 1,
        select: { correctCount: true, contest: { select: { questionCount: true } } },
      },
    },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Concours National de Logique";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Candidats");
  sheet.columns = [
    { header: "Nom et prénom", key: "fullName", width: 28 },
    { header: "Sexe", key: "gender", width: 11 },
    { header: "Date de naissance", key: "birthDate", width: 18 },
    { header: "Niveau scolaire", key: "level", width: 16 },
    { header: "Ville", key: "city", width: 16 },
    { header: "Téléphone", key: "phone", width: 16 },
    { header: "Adresse e-mail", key: "email", width: 30 },
    { header: "Participations", key: "attempts", width: 14 },
    { header: "Meilleur score", key: "best", width: 16 },
    { header: "Inscrit le", key: "createdAt", width: 18 },
  ];

  for (const candidate of candidates) {
    const best = candidate.attempts[0];
    sheet.addRow({
      fullName: candidate.fullName,
      gender: GENDER_LABEL[candidate.gender],
      birthDate: candidate.birthDate,
      level: levelText(candidate.educationLevel, candidate.otherLevel),
      city: CITY_LABEL[candidate.city],
      phone: candidate.phone,
      email: candidate.email,
      attempts: candidate._count.attempts,
      best: best ? `${best.correctCount}/${best.contest.questionCount}` : "—",
      createdAt: candidate.createdAt,
    });
  }

  sheet.getColumn("birthDate").numFmt = "dd/mm/yyyy";
  sheet.getColumn("createdAt").numFmt = "dd/mm/yyyy hh:mm";

  styleHeader(sheet);
  zebra(sheet);

  return workbookResponse(workbook, "candidats-concours-logique.xlsx");
}
