/**
 * Servicio CFDI 4.0 para facturación electrónica México (SAT).
 * Integración con PAC (Proveedor Autorizado de Certificación).
 *
 * Requiere: RFC, régimen fiscal, certificado SAT, cuenta en PAC (Facturama, FiscalAPI, etc.)
 * Configurar en Configuración > Datos fiscales.
 */

import type { SaleItem } from "./types";
import { SERVIPARTZ_INFO } from "./storeInfo";

const CFDI_CONFIG_KEY = "servipartz-cfdi-config";

export interface CFDIConfig {
  rfc: string;
  razonSocial: string;
  regimenFiscal: string;
  domicilioFiscal?: string;
  codigoPostal?: string;
  pacUser?: string;
  pacPassword?: string;
  pacUrl?: string;
}

export interface CFDIResult {
  success: boolean;
  uuid?: string;
  pdfUrl?: string;
  xml?: string;
  error?: string;
}

/** Obtiene la configuración CFDI guardada */
export function getCFDIConfig(): CFDIConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CFDI_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CFDIConfig;
  } catch {
    return null;
  }
}

/** Guarda la configuración CFDI */
export function setCFDIConfig(config: CFDIConfig): void {
  try {
    localStorage.setItem(CFDI_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

/** Genera CFDI a partir de los datos del ticket/venta.
 * Si no hay configuración PAC, retorna error indicando que debe configurarse.
 */
export async function generateCFDI(
  items: SaleItem[],
  total: number,
  ticketNumber: number,
  date: Date
): Promise<CFDIResult> {
  const config = getCFDIConfig();
  if (!config?.rfc?.trim()) {
    return {
      success: false,
      error: "Configura RFC y datos fiscales en Configuración > Datos fiscales",
    };
  }

  if (!config.pacUser || !config.pacPassword || !config.pacUrl) {
    return {
      success: false,
      error: "Configura credenciales del PAC (Facturama, FiscalAPI, etc.) en Configuración",
    };
  }

  // Estructura CFDI 4.0 simplificada para factura de ingreso
  const receptor = {
    Rfc: "XAXX010101000",
    Nombre: "PÚBLICO EN GENERAL",
    UsoCFDI: "S01",
    DomicilioFiscalReceptor: config.codigoPostal || "83000",
    RegimenFiscalReceptor: "616",
  };

  const conceptos = items.map((item) => {
    const price = item.price ?? 0;
    const quantity = item.quantity;
    const importe = price * quantity;
    return {
      ClaveProdServ: "84111506",
      Cantidad: quantity,
      ClaveUnidad: "E48",
      Unidad: "Unidad de servicio",
      Descripcion: item.name,
      ValorUnitario: price,
      Importe: importe,
      ObjetoImp: "02",
    };
  });

  const payload = {
    Serie: "A",
    Folio: String(ticketNumber).padStart(6, "0"),
    Fecha: date.toISOString(),
    SubTotal: total,
    Moneda: "MXN",
    TipoCambio: "1",
    Total: total,
    TipoDeComprobante: "I",
    LugarExpedicion: config.codigoPostal || "83000",
    Emisor: {
      Rfc: config.rfc.trim().toUpperCase(),
      Nombre: config.razonSocial.trim() || SERVIPARTZ_INFO.name,
      RegimenFiscal: config.regimenFiscal,
    },
    Receptor: receptor,
    Conceptos: conceptos,
  };

  try {
    const auth = btoa(`${config.pacUser}:${config.pacPassword}`);
    const res = await fetch(config.pacUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        error: `Error PAC: ${res.status} - ${errText.slice(0, 200)}`,
      };
    }

    const data = (await res.json()) as { Id?: string; Uuid?: string; PdfUrl?: string; Xml?: string };
    return {
      success: true,
      uuid: data.Uuid || data.Id,
      pdfUrl: data.PdfUrl,
      xml: data.Xml,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      success: false,
      error: `Error de conexión: ${msg}`,
    };
  }
}
