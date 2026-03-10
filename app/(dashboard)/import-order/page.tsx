"use client";

import { useState, useCallback } from "react";
import { Package, Upload, Download } from "lucide-react";
import { loadInventory, saveInventory } from "@/lib/inventoryStorage";
import { applyOrderToInventory, sheetToOrderRows } from "@/lib/orderImport";
import { buildSalesOrderExcelTemplate, downloadSalesOrderTemplate } from "@/lib/excelTemplate";
import { setLastInventoryUpdate } from "@/lib/inventoryUpdate";
import { setLastInventoryComplete } from "@/lib/lastInventoryComplete";
import { movementsService, notificationsService } from "@/lib/movements";
import { demoAuth } from "@/lib/demoAuth";
import { useToast } from "@/components/Toast/ToastContext";

export default function ImportOrderPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [appliedCount, setAppliedCount] = useState(0);
  const [unmatchedCount, setUnmatchedCount] = useState(0);
  const [detailRows, setDetailRows] = useState<string[]>([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const toast = useToast();

  const handleDownloadTemplate = useCallback(async () => {
    const bottles = loadInventory();
    if (bottles.length === 0) {
      const msg = "Primero configura tu inventario en Configuración → Modifica tu inventario.";
      setMessage(msg);
      setStatus("error");
      toast.show({ title: "Error", message: msg, type: "error" });
      return;
    }
    setTemplateLoading(true);
    try {
      const blob = await buildSalesOrderExcelTemplate(bottles);
      downloadSalesOrderTemplate(blob, "plantilla-ingreso-pedido.xlsx");
    } catch (e) {
      const msg = "No se pudo generar la plantilla. Intenta de nuevo.";
      setMessage(msg);
      setStatus("error");
      toast.show({ title: "Error", message: msg, type: "error" });
    } finally {
      setTemplateLoading(false);
    }
  }, [toast]);

  const processFile = useCallback(async (file: File) => {
    setStatus("loading");
    setMessage("");
    setDetailRows([]);

    try {
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.default.Workbook();
      const data = await file.arrayBuffer();
      await workbook.xlsx.load(data);
      
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        const msg = "El archivo no tiene hojas.";
        setStatus("error");
        setMessage(msg);
        toast.show({ title: "Error", message: msg, type: "error" });
        return;
      }

      // Leer header y convertir a JSON
      const headerRow = worksheet.getRow(1);
      const headers: string[] = [];
      headerRow?.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = String(cell.value ?? "").trim().toLowerCase();
      });

      const json: { [key: string]: unknown }[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        const obj: { [key: string]: unknown } = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            obj[header] = cell.value ?? "";
          }
        });
        if (Object.keys(obj).length > 0) {
          json.push(obj);
        }
      });

      const orderRows = sheetToOrderRows(json);
      if (orderRows.length === 0) {
        const msg = "Archivo leído. No se encontraron filas de pedido (revisa columnas 'producto/nombre' y 'cantidad').";
        setStatus("success");
        setMessage(msg);
        toast.show({ title: "Listo", message: msg, type: "success" });
        return;
      }

      const bottles = loadInventory();
      if (bottles.length === 0) {
        const msg = "No hay inventario. Configura los productos en Configuración → Modifica tu inventario.";
        setStatus("error");
        setMessage(msg);
        toast.show({ title: "Error", message: msg, type: "error" });
        return;
      }

      const result = applyOrderToInventory(bottles, orderRows);
      saveInventory(result.updatedBottles);

      const now = new Date();
      const dateStr = now.toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      setLastInventoryUpdate(dateStr);
      setLastInventoryComplete("general");

      movementsService.add({
        type: "order_import",
        bottleId: "_",
        bottleName: "Importar pedido",
        newValue: result.applied.length,
        userName: demoAuth.getCurrentUser()?.name ?? "Usuario",
        description: `${result.applied.length} líneas sumadas al inventario`,
      });
      notificationsService.incrementUnread();

      setAppliedCount(result.applied.length);
      setUnmatchedCount(result.unmatched.length);
      const details = result.applied.slice(0, 15).map((a) => `${a.bottleName}: +${a.added.toFixed(a.unit === "oz" ? 1 : 0)} ${a.unit}`);
      if (result.unmatched.length > 0) {
        details.push(`Sin match: ${result.unmatched.slice(0, 5).join(", ")}${result.unmatched.length > 5 ? "…" : ""}`);
      }
      setDetailRows(details);

      setStatus("success");
      setMessage("Pedido Agregado");
      toast.show({ title: "Listo", message: "Pedido Agregado", type: "success" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al leer el archivo. ¿Es un Excel o CSV válido?";
      setStatus("error");
      setMessage(msg);
      toast.show({ title: "Error", message: msg, type: "error" });
    }
  }, [toast]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    e.target.value = "";
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden overflow-touch">
      <div className="min-h-full flex flex-col justify-center px-4 py-6 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="max-w-lg mx-auto w-full space-y-6 -mt-24">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-apple-surface border border-apple-border">
            <Package className="w-8 h-8 text-apple-accent" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-apple-text">Importar pedido</h2>
            <p className="text-sm text-apple-text2">
              Sube un Excel o CSV con el pedido para sumar todo al inventario de un solo jalón.
            </p>
          </div>
        </div>

        <div className="bg-apple-surface rounded-xl border border-apple-border p-4 space-y-4">
          <p className="text-sm text-apple-text2">
            Descarga la plantilla Excel con lista desplegable de productos y cantidad solo en enteros. Complétala y súbela aquí.
          </p>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={templateLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-apple-accent text-white rounded-xl hover:opacity-90 transition-opacity font-medium text-sm disabled:opacity-60"
          >
            <Download className="w-5 h-5 flex-shrink-0" />
            {templateLoading ? "Generando…" : "Descargar plantilla Excel"}
          </button>
          <p className="text-xs text-apple-text2">
            La plantilla tiene columna <strong>Producto</strong> (lista con tus repuestos) y <strong>Cantidad</strong> (solo números enteros).
          </p>
          <a
            href="/plantilla-ingreso-pedido.csv"
            download="plantilla-ingreso-pedido.csv"
            className="text-sm text-apple-accent hover:underline"
          >
            Descargar plantilla CSV (sin validaciones)
          </a>
          <label className="flex flex-col items-center justify-center gap-2 py-6 px-4 border-2 border-dashed border-apple-border rounded-xl hover:bg-apple-bg transition-colors cursor-pointer">
            <Upload className="w-10 h-10 text-apple-text2" />
            <span className="text-sm font-medium text-apple-text">Elegir archivo Excel o CSV</span>
            <span className="text-xs text-apple-text2">.xlsx, .xls o .csv</span>
            <input
              id="import-order-file"
              name="orderFile"
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              onChange={onInputChange}
              className="hidden"
            />
          </label>
        </div>

        {status === "loading" && (
          <div className="flex items-center gap-2 text-apple-text2">
            <span className="inline-block w-4 h-4 border-2 border-apple-accent border-t-transparent rounded-full animate-spin" />
            Leyendo archivo…
          </div>
        )}

        <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
          <h3 className="font-semibold text-apple-text text-sm mb-1">Formato del archivo</h3>
          <p className="text-xs text-apple-text">
            La plantilla tiene las columnas <strong>Producto</strong> y <strong>Cantidad</strong>. Escribe el nombre del repuesto exactamente como aparece en tu inventario.
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
