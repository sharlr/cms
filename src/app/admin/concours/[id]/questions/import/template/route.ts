import { requireAdmin } from "@/lib/admin";
import { styleHeader, workbookResponse } from "@/lib/excel";
import { buildImportTemplate } from "@/lib/question-import";

/** Classeur modèle pour l'import de questions. */
export async function GET() {
  await requireAdmin();

  const { workbook, sheet } = buildImportTemplate();
  styleHeader(sheet);

  return workbookResponse(workbook, "modele-import-questions.xlsx");
}
