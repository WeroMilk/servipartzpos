"use client";

import { useState, useEffect } from "react";
import { movementsService, notificationsService, Movement } from "@/lib/movements";
import { motion } from "framer-motion";
import { Check, X, Edit, Settings, ChevronLeft, ChevronRight, Package, Type, Calendar, FileSpreadsheet, ArrowLeftRight, ClipboardCheck, Lock } from "lucide-react";
import { isBeerBottleId } from "@/lib/measurementRules";

/** Items por página: en móvil sin scroll (reducir boxes para que todo quepa). */
function getItemsPerPage(width: number, height: number = 800) {
  if (width >= 1024) return 6;
  if (width >= 768) return 7;
  // Móvil: pocos ítems para que no haga falta scroll (sensación de app)
  if (height < 560) return 4;
  if (height < 620) return 5;
  if (height < 700) return 5;
  if (height < 780) return 6;
  return 7;
}

export default function MovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() =>
    typeof window !== "undefined" ? getItemsPerPage(window.innerWidth, window.innerHeight) : 6
  );

  useEffect(() => {
    const all = movementsService.getAll();
    setMovements(all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    notificationsService.markAsRead();
  }, []);

  useEffect(() => {
    const update = () => {
      if (typeof window === "undefined") return;
      setItemsPerPage(getItemsPerPage(window.innerWidth, window.innerHeight));
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(movements.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMovements = movements.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [totalPages, itemsPerPage]);

  const goToPrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  const getMovementIcon = (type: Movement["type"]) => {
    switch (type) {
      case "inventory_check_ok": return <Check className="w-4 h-4 text-green-600" />;
      case "inventory_check_fail": return <X className="w-4 h-4 text-red-600" />;
      case "inventory_complete": return <ClipboardCheck className="w-4 h-4 text-emerald-600" />;
      case "edit": return <Edit className="w-4 h-4 text-orange-500" />;
      case "portion_change": return <Settings className="w-4 h-4 text-purple-500" />;
      case "inventory_list_updated": return <Package className="w-4 h-4 text-indigo-500" />;
      case "bar_name_change": return <Type className="w-4 h-4 text-slate-600" />;
      case "employee_password_change": return <Lock className="w-4 h-4 text-amber-600" />;
      case "last_update_date": return <Calendar className="w-4 h-4 text-amber-600" />;
      case "sales_import": return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case "order_import": return <FileSpreadsheet className="w-4 h-4 text-orange-500" />;
      case "bottles_reorder": return <ArrowLeftRight className="w-4 h-4 text-cyan-600" />;
      case "sort_change": return <Settings className="w-4 h-4 text-slate-500" />;
      default: return null;
    }
  };

  const formatValue = (value: number, bottleId: string) => {
    const isBeer = isBeerBottleId(bottleId);
    return isBeer ? `${value.toFixed(0)} unid` : `${value.toFixed(1)} oz`;
  };

  const getMovementLabel = (movement: Movement) => {
    if (movement.description) return movement.description;
    const isBeer = isBeerBottleId(movement.bottleId);
    switch (movement.type) {
      case "inventory_check_ok": return `Verificación OK: inventario correcto (${formatValue(movement.newValue, movement.bottleId)})`;
      case "inventory_check_fail": return `Verificación: inventario incorrecto (${formatValue(movement.newValue, movement.bottleId)})`;
      case "edit": return `Editado: ${movement.oldValue != null ? formatValue(movement.oldValue, movement.bottleId) : "?"} → ${formatValue(movement.newValue, movement.bottleId)}`;
      case "portion_change": return `Porción cambiada a ${isBeer ? `${movement.newValue} unid` : `${movement.newValue} oz`}`;
      default: return "";
    }
  };

  const formatDateOnly = (date: Date) =>
    new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
  const formatTimeOnly = (date: Date) =>
    new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(date);
  const formatDateFull = (date: Date) =>
    new Intl.DateTimeFormat("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(date);

  const handleClearAll = () => {
    if (!movements.length) return;
    const confirmed = window.confirm("¿Seguro que quieres borrar todo el historial de movimientos?");
    if (!confirmed) return;
    movementsService.clear();
    setMovements([]);
    setCurrentPage(1);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="px-4 pt-2 pb-1 flex-shrink-0 md:pt-2 md:pb-1 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-apple-text">Movimientos</h2>
            <p className="text-xs text-apple-text2">Historial de cambios en el inventario</p>
          </div>
          {movements.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] md:text-xs px-2.5 py-1.5 rounded-lg border border-apple-border text-apple-text2 hover:text-red-600 hover:border-red-400 hover:bg-red-50 transition-colors"
            >
              Borrar historial
            </button>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 pb-1 md:pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
          {movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
              <p className="text-apple-text2 mb-2">No hay movimientos registrados</p>
              <p className="text-sm text-apple-text2">Los cambios aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-1.5 md:space-y-1">
              {paginatedMovements.map((movement, index) => (
                  <motion.div
                    key={movement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-apple-surface rounded-xl p-2.5 md:p-2 border border-apple-border"
                  >
                    <div className="flex items-start gap-2 md:gap-2">
                      <div className="flex-shrink-0 mt-0.5">{getMovementIcon(movement.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="font-semibold text-apple-text text-sm">{movement.bottleName}</p>
                          <div className="flex flex-col items-end flex-shrink-0 text-right">
                            <span className="text-[10px] md:text-xs text-apple-text2 md:hidden">{formatDateOnly(movement.timestamp)}</span>
                            <span className="text-[10px] md:text-xs text-apple-text2 md:hidden">{formatTimeOnly(movement.timestamp)}</span>
                            <span className="hidden md:inline text-[10px] md:text-xs text-apple-text2">{formatDateFull(movement.timestamp)}</span>
                          </div>
                        </div>
                        <p className="text-xs md:text-sm text-apple-text2 mb-0.5">{getMovementLabel(movement)}</p>
                        <p className="text-[10px] md:text-xs text-apple-text2">Empleado: {movement.userName}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </div>

        {/* Paginación: mismo estilo que inventario (X de Y + flechas en móvil, números en desktop) */}
        {movements.length > 0 && (
          <div className="flex-shrink-0 border-t border-apple-border bg-apple-bg px-4 py-2 md:py-2">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={goToPrevPage}
                disabled={currentPage <= 1}
                className="w-10 h-10 rounded-xl border border-apple-border bg-apple-surface text-apple-text flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none hover:bg-apple-bg active:bg-apple-bg transition-colors flex-shrink-0 touch-manipulation md:w-8 md:h-8"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
              </button>

              <div className="flex items-center min-w-0 flex-1 justify-center md:flex-initial md:flex-shrink-0">
                <span className="text-sm font-medium text-apple-text md:hidden">
                  {currentPage} de {totalPages}
                </span>
                <div className="hidden md:flex items-center gap-1 flex-wrap justify-center">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[1.75rem] h-8 text-xs px-2 rounded-lg font-medium transition-colors flex-shrink-0 touch-manipulation ${
                        page === currentPage
                          ? "bg-apple-accent text-white border border-apple-accent"
                          : "border border-apple-border bg-apple-surface text-apple-text hover:bg-apple-bg"
                      }`}
                      aria-label={`Página ${page}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage >= totalPages}
                className="w-10 h-10 rounded-xl border border-apple-border bg-apple-surface text-apple-text flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none hover:bg-apple-bg active:bg-apple-bg transition-colors flex-shrink-0 touch-manipulation md:w-8 md:h-8"
                aria-label="Siguiente"
              >
                <ChevronRight className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
