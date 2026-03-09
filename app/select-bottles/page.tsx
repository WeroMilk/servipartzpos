"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/Auth/AuthGuard";
import { categories, defaultBottles } from "@/lib/bottlesData";
import { saveBarBottles } from "@/lib/barStorage";
import { movementsService } from "@/lib/movements";
import { demoAuth } from "@/lib/demoAuth";
import { Bottle } from "@/lib/types";
import { Check, ChevronRight, ChevronLeft } from "lucide-react";
import LogoutButton from "@/components/Auth/LogoutButton";
import BottleCard from "@/components/SelectBottles/BottleCard";
import { motion } from "framer-motion";

/** Items por pantalla según ancho y alto.
 *  - Desktop / tablet: 10 boxes (para vista fija y clara).
 *  - Móvil: ajusta por altura para evitar boxes cortados.
 */
function getItemsPerPage(width: number, height: number = 800) {
  // Desktop y tablet: siempre 10 por página
  if (width >= 1024) return 10;
  if (width >= 768) return 10;

  // Móvil muy estrecho
  if (width < 380) {
    if (height < 600) return 4;
    if (height < 680) return 6;
    if (height < 760) return 8;
    return 10;
  }

  // Móvil normal: ajustar por altura
  if (height < 600) return 6;
  if (height < 680) return 8;
  if (height < 760) return 10;
  return 12;
}

export default function SelectBottlesPage() {
  const [selectedBottles, setSelectedBottles] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() =>
    typeof window !== "undefined" ? getItemsPerPage(window.innerWidth, window.innerHeight) : 10
  );
  const router = useRouter();

  useEffect(() => {
    const update = () => setItemsPerPage(getItemsPerPage(window.innerWidth, window.innerHeight));
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  const toggleBottle = (bottleId: string) => {
    const newSelected = new Set(selectedBottles);
    if (newSelected.has(bottleId)) {
      newSelected.delete(bottleId);
    } else {
      newSelected.add(bottleId);
    }
    setSelectedBottles(newSelected);
  };

  const toggleCategory = (categoryId: string) => {
    const categoryBottles = defaultBottles
      .filter((b) => b.category === categoryId)
      .map((b) => b.id);

    const newSelected = new Set(selectedBottles);
    const allSelected = categoryBottles.every((id) => newSelected.has(id));

    if (allSelected) {
      categoryBottles.forEach((id) => newSelected.delete(id));
    } else {
      categoryBottles.forEach((id) => newSelected.add(id));
    }
    setSelectedBottles(newSelected);
  };

  const handleContinue = () => {
    if (selectedBottles.size === 0) {
      alert("Por favor selecciona al menos un producto");
      return;
    }
    const barBottles = defaultBottles.filter((b) => selectedBottles.has(b.id));
    saveBarBottles(barBottles);
    movementsService.add({
      type: "inventory_list_updated",
      bottleId: "_",
      bottleName: "Inventario",
      newValue: barBottles.length,
      userName: demoAuth.getCurrentUser()?.name ?? "Usuario",
      description: `Inventario actualizado: ${barBottles.length} productos`,
    });
    router.push("/bar");
  };

  const filteredBottles = selectedCategory
    ? defaultBottles.filter((b) => b.category === selectedCategory)
    : defaultBottles;

  const totalPages = Math.max(1, Math.ceil(filteredBottles.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBottles = filteredBottles.slice(startIndex, startIndex + itemsPerPage);

  // Ajustar página actual si al cambiar itemsPerPage o categoría ya no es válida
  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [itemsPerPage, selectedCategory, totalPages]);

  const goToPrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  return (
    <AuthGuard>
      {/* Misma altura que dashboard: 100dvh en iOS y Android (como iPhone 14 Pro Max) */}
      <div
        className="bg-apple-bg overflow-hidden flex flex-col safe-area-x"
        style={{
          height: "var(--app-height, 100dvh)",
          minHeight: "100dvh",
          maxHeight: "100dvh",
        }}
      >
        {/* 1. Header compacto en móvil para evitar scroll */}
        <div
          className="bg-apple-surface border-b border-apple-border pl-2 pr-4 py-1.5 min-[380px]:pl-4 min-[380px]:pr-5 min-[380px]:py-2.5 sm:pl-5 sm:pr-6 sm:py-3 md:pl-6 md:pr-6 md:py-4 flex-shrink-0 z-10"
          style={{ paddingTop: "max(0.375rem, env(safe-area-inset-top, 0px))" }}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 min-w-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-sm min-[380px]:text-base sm:text-xl md:text-2xl font-semibold text-apple-text truncate">
                Selecciona productos
              </h1>
              <p className="text-[10px] min-[380px]:text-[11px] sm:text-xs text-apple-text2 mt-0.5 truncate">
                {selectedBottles.size} {selectedBottles.size === 1 ? "producto" : "productos"}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>

        {/* 2. Categorías en una línea compacta */}
        <div className="bg-apple-bg flex-shrink-0 px-2 min-[380px]:px-4 sm:px-5 md:px-6 pt-1.5 min-[380px]:pt-2 sm:pt-3 pb-1.5 min-[380px]:pb-2">
          <div className="max-w-6xl mx-auto w-full min-w-0">
            <div className="flex items-center gap-1 min-[380px]:gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide -mx-0.5 min-w-0 overscroll-x-contain" style={{ WebkitOverflowScrolling: "touch" }}>
              <button
                onClick={() => handleCategoryChange(null)}
                className={`flex-shrink-0 px-2.5 py-1 min-[380px]:px-3 min-[380px]:py-1.5 rounded-full text-[11px] min-[380px]:text-xs sm:text-sm font-medium transition-all ${
                  selectedCategory === null
                    ? "bg-apple-accent text-white"
                    : "bg-apple-surface border border-apple-border text-apple-text hover:bg-apple-bg"
                }`}
              >
                Todas
              </button>
              {categories.map((category) => {
                const categoryBottles = defaultBottles.filter(
                  (b) => b.category === category.id
                );
                const selectedCount = categoryBottles.filter((b) =>
                  selectedBottles.has(b.id)
                ).length;

                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`flex-shrink-0 px-2.5 py-1 min-[380px]:px-3 min-[380px]:py-1.5 rounded-full text-[11px] min-[380px]:text-xs sm:text-sm font-medium transition-all relative whitespace-nowrap ${
                      selectedCategory === category.id
                        ? "bg-apple-accent text-white"
                        : "bg-apple-surface border border-apple-border text-apple-text hover:bg-apple-bg"
                    }`}
                  >
                    {category.name}
                    {selectedCount > 0 && (
                      <span className={`ml-1 min-[380px]:ml-1.5 px-1 py-0.5 rounded-full text-[9px] min-[380px]:text-[10px] ${
                        selectedCategory === category.id
                          ? "bg-white/20 text-white"
                          : "bg-apple-accent text-white"
                      }`}>
                        {selectedCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Grid de boxes: en desktop mismo espacio arriba y abajo (entre categorías y línea gris); en móvil scroll si hace falta */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden w-full md:overflow-y-hidden md:overflow-hidden md:flex md:flex-col md:justify-start"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div
            className="max-w-6xl mx-auto px-2 min-[380px]:px-4 sm:px-5 md:px-6 w-full min-w-0 pb-[calc(200px+env(safe-area-inset-bottom,0px))] min-[380px]:pb-[calc(220px+env(safe-area-inset-bottom,0px))] sm:pb-[calc(240px+env(safe-area-inset-bottom,0px))] md:pb-0 pt-0.5 md:pt-4 md:pb-4 md:flex-shrink-0"
          >
            {filteredBottles.length === 0 ? (
              <div className="text-center py-6 min-[380px]:py-8 px-4">
                <p className="text-xs min-[380px]:text-sm text-apple-text2">No hay productos en esta categoría</p>
              </div>
            ) : (
              <div className="w-full min-w-0 flex justify-center">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 min-[380px]:gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 w-full max-w-5xl min-w-0 [grid-auto-rows:minmax(80px,1fr)] min-[380px]:[grid-auto-rows:minmax(88px,1fr)] sm:[grid-auto-rows:minmax(118px,1fr)] md:[grid-auto-rows:minmax(132px,1fr)] lg:[grid-auto-rows:minmax(148px,1fr)]">
                  {paginatedBottles.map((bottle, index) => (
                    <motion.div
                      key={bottle.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="min-w-0 min-h-0 flex"
                    >
                      <BottleCard
                        bottle={bottle}
                        isSelected={selectedBottles.has(bottle.id)}
                        onClick={() => toggleBottle(bottle.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer compacto en móvil para que quepa sin scroll */}
        <footer
          className="fixed bottom-0 left-0 right-0 z-20 flex flex-col flex-shrink-0 bg-apple-bg border-t border-apple-border shadow-[0_-2px_10px_rgba(0,0,0,0.06)] pt-1 min-[380px]:pt-1.5 sm:pt-2 md:pt-3 pb-[max(0.75rem,calc(env(safe-area-inset-bottom,0px)+0.5rem))]"
          style={{
            paddingLeft: "env(safe-area-inset-left, 0px)",
            paddingRight: "env(safe-area-inset-right, 0px)",
          }}
        >
          {/* Paginación + Seleccionar Todos */}
          {filteredBottles.length > 0 && (
            <div className="w-full py-1 min-[380px]:py-1.5 sm:py-2 px-2 min-[380px]:px-4 sm:px-5 md:px-6 flex-shrink-0">
              <div className="max-w-6xl mx-auto flex flex-col items-center justify-center gap-2 sm:gap-3 w-full min-w-0">
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 w-full min-w-0 py-0.5">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage <= 1}
                    className="w-9 h-9 min-[380px]:w-10 min-[380px]:h-10 rounded-lg border border-apple-border bg-apple-surface text-apple-text flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none hover:bg-apple-bg active:bg-apple-bg transition-colors flex-shrink-0 touch-manipulation md:w-8 md:h-8 lg:w-9 lg:h-9"
                    aria-label="Anterior"
                  >
                    <ChevronLeft className="w-4 h-4 min-[380px]:w-5 min-[380px]:h-5 md:w-4 md:h-4 shrink-0" />
                  </button>

                  <div className="flex items-center min-w-0 flex-1 justify-center md:flex-initial md:flex-shrink-0">
                    <span className="text-xs min-[380px]:text-sm font-medium text-apple-text md:hidden">
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
                    className="w-9 h-9 min-[380px]:w-10 min-[380px]:h-10 rounded-lg border border-apple-border bg-apple-surface text-apple-text flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none hover:bg-apple-bg active:bg-apple-bg transition-colors flex-shrink-0 touch-manipulation md:w-8 md:h-8 lg:w-9 lg:h-9"
                    aria-label="Siguiente"
                  >
                    <ChevronRight className="w-4 h-4 min-[380px]:w-5 min-[380px]:h-5 md:w-4 md:h-4 shrink-0" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    const categoryBottles = filteredBottles.map((b) => b.id);
                    const allSelected = categoryBottles.every((id) =>
                      selectedBottles.has(id)
                    );
                    const newSelected = new Set(selectedBottles);
                    if (allSelected) {
                      categoryBottles.forEach((id) => newSelected.delete(id));
                    } else {
                      categoryBottles.forEach((id) => newSelected.add(id));
                    }
                    setSelectedBottles(newSelected);
                  }}
                  className="px-2.5 py-1.5 min-[380px]:px-3 sm:px-3 sm:py-1.5 bg-apple-surface border border-apple-border rounded-lg text-[11px] min-[380px]:text-xs sm:text-xs text-apple-text hover:bg-apple-bg transition-colors touch-manipulation min-h-[40px] sm:min-h-0 flex items-center justify-center"
                >
                  {filteredBottles.every((b) => selectedBottles.has(b.id))
                    ? "Deseleccionar Todos"
                    : "Seleccionar Todos"}
                </button>
              </div>
            </div>
          )}

          <div className="flex-shrink-0 h-1 min-[380px]:h-1.5" aria-hidden />

          {/* Botón Continuar */}
          <div className="w-full pt-1 min-[380px]:pt-1.5 sm:pt-2 pb-0 px-2 min-[380px]:px-4 sm:px-6 md:px-8 flex-shrink-0">
            <div className="max-w-6xl mx-auto flex justify-center min-w-0">
              <button
                onClick={handleContinue}
                disabled={selectedBottles.size === 0}
                className="w-full max-w-[280px] sm:max-w-[300px] md:max-w-[320px] min-h-[44px] min-[380px]:min-h-[48px] sm:min-h-[52px] md:min-h-[56px] bg-apple-accent text-white font-semibold py-2.5 min-[380px]:py-3 sm:py-3.5 px-4 text-xs min-[380px]:text-sm sm:text-base rounded-xl active:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation select-none transition-opacity duration-150 shadow-sm"
              >
                <span className="flex items-center gap-2 flex-1 justify-center min-w-0 flex-wrap">
                  <span>Continuar con</span>
                  <span className="inline-flex items-center gap-2 whitespace-nowrap">
                    {selectedBottles.size} {selectedBottles.size === 1 ? "botella" : "botellas"}
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" strokeWidth={2.5} />
                  </span>
                </span>
              </button>
            </div>
          </div>
        </footer>
      </div>
    </AuthGuard>
  );
}
