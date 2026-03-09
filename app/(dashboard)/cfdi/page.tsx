"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCFDIConfig, setCFDIConfig, type CFDIConfig } from "@/lib/cfdiService";
import { FileText, ArrowLeft } from "lucide-react";

export default function CFDIPage() {
  const [cfdiForm, setCfdiForm] = useState<CFDIConfig>({
    rfc: "",
    razonSocial: "",
    regimenFiscal: "601",
    domicilioFiscal: "",
    codigoPostal: "",
    pacUser: "",
    pacPassword: "",
    pacUrl: "https://api.facturama.mx/2/cfdi",
  });

  useEffect(() => {
    const c = getCFDIConfig();
    if (c) setCfdiForm((prev) => ({ ...prev, ...c }));
  }, []);

  const handleSave = () => {
    setCFDIConfig(cfdiForm);
  };

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-apple-bg">
      <div className="flex-shrink-0 px-4 pt-2 pb-1 flex items-center gap-2">
        <Link
          href="/config"
          className="flex items-center justify-center w-9 h-9 rounded-xl text-apple-text2 hover:bg-apple-surface transition-colors"
          aria-label="Volver a Configuraciones"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-lg font-semibold text-apple-text">Datos fiscales (CFDI)</h2>
          <p className="text-xs text-apple-text2">RFC, régimen y credenciales PAC para facturación electrónica.</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 sm:px-4 py-2 sm:py-3 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] sm:pb-3" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="max-w-2xl mx-auto w-full space-y-4">
          <section className="bg-apple-surface rounded-xl sm:rounded-2xl border border-apple-border shadow-sm overflow-hidden">
            <div className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 border-b border-apple-border/60 flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-apple-accent/10 shrink-0">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-apple-accent" aria-hidden />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-apple-text">Información fiscal</h3>
                <p className="text-[10px] sm:text-xs text-apple-text2">Datos del emisor para facturación electrónica.</p>
              </div>
            </div>
            <div className="p-3 sm:p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-apple-text mb-1">RFC</label>
                <input
                  type="text"
                  value={cfdiForm.rfc}
                  onChange={(e) => setCfdiForm((p) => ({ ...p, rfc: e.target.value }))}
                  placeholder="XAXX010101000"
                  className="w-full px-3 py-2 text-sm border border-apple-border rounded-lg bg-apple-bg focus:outline-none focus:ring-2 focus:ring-apple-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-apple-text mb-1">Razón social</label>
                <input
                  type="text"
                  value={cfdiForm.razonSocial}
                  onChange={(e) => setCfdiForm((p) => ({ ...p, razonSocial: e.target.value }))}
                  placeholder="Nombre o razón social"
                  className="w-full px-3 py-2 text-sm border border-apple-border rounded-lg bg-apple-bg focus:outline-none focus:ring-2 focus:ring-apple-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-apple-text mb-1">Régimen fiscal</label>
                <select
                  value={cfdiForm.regimenFiscal}
                  onChange={(e) => setCfdiForm((p) => ({ ...p, regimenFiscal: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-apple-border rounded-lg bg-apple-bg focus:outline-none focus:ring-2 focus:ring-apple-accent"
                >
                  <option value="601">601 - General de Ley Personas Morales</option>
                  <option value="603">603 - Personas Morales con fines no lucrativos</option>
                  <option value="606">606 - Régimen de Incorporación Fiscal</option>
                  <option value="612">612 - Personas Físicas con Actividades Empresariales</option>
                  <option value="620">620 - Sociedades Cooperativas de Producción</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-apple-text mb-1">Código postal</label>
                <input
                  type="text"
                  value={cfdiForm.codigoPostal}
                  onChange={(e) => setCfdiForm((p) => ({ ...p, codigoPostal: e.target.value }))}
                  placeholder="83000"
                  className="w-full px-3 py-2 text-sm border border-apple-border rounded-lg bg-apple-bg focus:outline-none focus:ring-2 focus:ring-apple-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-apple-text mb-1">Domicilio fiscal</label>
                <input
                  type="text"
                  value={cfdiForm.domicilioFiscal ?? ""}
                  onChange={(e) => setCfdiForm((p) => ({ ...p, domicilioFiscal: e.target.value }))}
                  placeholder="Calle, número, colonia, ciudad"
                  className="w-full px-3 py-2 text-sm border border-apple-border rounded-lg bg-apple-bg focus:outline-none focus:ring-2 focus:ring-apple-accent"
                />
              </div>
            </div>
          </section>

          <section className="bg-apple-surface rounded-xl sm:rounded-2xl border border-apple-border shadow-sm overflow-hidden">
            <div className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 border-b border-apple-border/60">
              <h3 className="text-sm font-semibold text-apple-text">Credenciales PAC</h3>
              <p className="text-[10px] sm:text-xs text-apple-text2 mt-0.5">Usuario y contraseña del Proveedor Autorizado de Certificación (Facturama, FiscalAPI, etc.)</p>
            </div>
            <div className="p-3 sm:p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-apple-text mb-1">URL del PAC (ej. Facturama)</label>
                <input
                  type="url"
                  value={cfdiForm.pacUrl}
                  onChange={(e) => setCfdiForm((p) => ({ ...p, pacUrl: e.target.value }))}
                  placeholder="https://api.facturama.mx/2/cfdi"
                  className="w-full px-3 py-2 text-sm border border-apple-border rounded-lg bg-apple-bg focus:outline-none focus:ring-2 focus:ring-apple-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-apple-text mb-1">Usuario PAC</label>
                <input
                  type="text"
                  value={cfdiForm.pacUser}
                  onChange={(e) => setCfdiForm((p) => ({ ...p, pacUser: e.target.value }))}
                  placeholder="Usuario de Facturama / PAC"
                  className="w-full px-3 py-2 text-sm border border-apple-border rounded-lg bg-apple-bg focus:outline-none focus:ring-2 focus:ring-apple-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-apple-text mb-1">Contraseña PAC</label>
                <input
                  type="password"
                  value={cfdiForm.pacPassword}
                  onChange={(e) => setCfdiForm((p) => ({ ...p, pacPassword: e.target.value }))}
                  placeholder="Contraseña del PAC"
                  className="w-full px-3 py-2 text-sm border border-apple-border rounded-lg bg-apple-bg focus:outline-none focus:ring-2 focus:ring-apple-accent"
                />
              </div>
            </div>
          </section>

          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3 bg-apple-accent text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Guardar datos fiscales
          </button>
        </div>
      </div>
    </div>
  );
}
