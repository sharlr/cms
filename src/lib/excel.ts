import ExcelJS from "exceljs";

/** En-tête bleu marque, ligne figée, filtre automatique. */
export function styleHeader(sheet: ExcelJS.Worksheet) {
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  header.height = 22;
  header.alignment = { vertical: "middle", horizontal: "left" };
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4644DC" } };
    cell.border = { bottom: { style: "thin", color: { argb: "FF2F2D92" } } };
  });

  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columnCount },
  };
}

/** Zébrures discrètes pour la lisibilité des grands tableaux. */
export function zebra(sheet: ExcelJS.Worksheet) {
  sheet.eachRow((row, index) => {
    if (index === 1 || index % 2 === 1) return;
    row.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4FD" } };
    });
  });
}

/** Classeur → réponse HTTP téléchargeable. */
export async function workbookResponse(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export { ExcelJS };
