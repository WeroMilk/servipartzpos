/**
 * Genera una plantilla Excel (.xlsx) con:
 * - Columna A: lista de productos del inventario (una por fila).
 * - Columna B: 0 en cada fila; el usuario cambia el 0 por la cantidad (pedido o ventas).
 */

import type { Bottle } from "./types";

const MAIN_SHEET_NAME = "Datos";

export async function buildSalesOrderExcelTemplate(bottles: Bottle[]): Promise<Blob> {
  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "Servipartz";

  const sheet = wb.addWorksheet(MAIN_SHEET_NAME);
  sheet.getColumn(1).width = 40;
  sheet.getColumn(2).width = 12;

  sheet.getCell(1, 1).value = "Producto";
  sheet.getCell(1, 2).value = "Cantidad";
  sheet.getRow(1).font = { bold: true };

  bottles.forEach((b, i) => {
    const row = i + 2;
    sheet.getCell(row, 1).value = b.name;
    sheet.getCell(row, 2).value = 0;
    sheet.getCell(row, 2).dataValidation = {
      type: "whole",
      allowBlank: true,
      operator: "greaterThanOrEqual",
      formulae: [0],
    };
  });

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Descarga la plantilla generada con el inventario actual.
 * Debe llamarse desde el cliente (usa bottles del inventario en localStorage).
 */
export function downloadSalesOrderTemplate(blob: Blob, filename: string = "plantilla-ventas-pedido.xlsx") {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
