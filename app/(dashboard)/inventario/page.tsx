"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import BottleDisplay from "@/components/Inventory/BottleDisplay";
import BottleThumbnail from "@/components/Inventory/BottleThumbnail";
import { categories } from "@/lib/bottlesData";
import { getLastInventoryComplete, setLastInventoryComplete, LAST_INVENTORY_COMPLETE_EVENT } from "@/lib/lastInventoryComplete";
import { Bottle } from "@/lib/types";
import { movementsService, notificationsService } from "@/lib/movements";
import { demoAuth } from "@/lib/demoAuth";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { storeStore } from "@/lib/storeStore";
import { updateProductStock, addMovement as addMovementFirestore } from "@/lib/firestore";
import { isMeasuredInUnits } from "@/lib/measurementRules";
import { useInventory } from "@/lib/hooks/useInventory";

type SortOption = "name-asc" | "quantity-desc" | "quantity-asc" | "custom";

export default function InventarioPage() {
  const storeId = typeof window !== "undefined" ? storeStore.getStoreId() : null;
  const { bottles, loading } = useInventory(storeId);

  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const [customOrder, setCustomOrder] = useState<string[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [displayBottles, setDisplayBottles] = useState<Bottle[]>([]);
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);
  const dragStartIndex = useRef<number | null>(null);

  // Inventario completo: contar productos revisados (✓ o ✗) hasta completar
  const [inventoryActive, setInventoryActive] = useState(false);
  const [inventoryReviewedIds, setInventoryReviewedIds] = useState<Set<string>>(new Set());
  const inventoryCompletedRef = useRef(false);
  const [lastInventory, setLastInventory] = useState(() => getLastInventoryComplete());

  useEffect(() => {
    const update = () => setLastInventory(getLastInventoryComplete());
    update();
    window.addEventListener(LAST_INVENTORY_COMPLETE_EVENT, update);
    return () => window.removeEventListener(LAST_INVENTORY_COMPLETE_EVENT, update);
  }, []);

  useEffect(() => {
    const savedOrder = localStorage.getItem("bottles-custom-order");
    if (savedOrder) {
      try {
        setCustomOrder(JSON.parse(savedOrder));
        setSortOption("custom");
      } catch {
        // Ignorar orden corrupto en localStorage
      }
    }
  }, []);

  const getPercentage = useCallback((bottle: Bottle) => {
    const mlToOz = (ml: number) => ml * 0.033814;
    return (mlToOz(bottle.currentOz) / mlToOz(bottle.size)) * 100;
  }, []);

  const sortedBottles = useMemo(() => {
    const sorted = [...bottles];
    if (sortOption === "custom" && customOrder) {
      const orderMap = new Map(customOrder.map((id, index) => [id, index]));
      return sorted.sort((a, b) => (orderMap.get(a.id) ?? Infinity) - (orderMap.get(b.id) ?? Infinity));
    }
    switch (sortOption) {
      case "name-asc": return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "quantity-desc": return sorted.sort((a, b) => getPercentage(b) - getPercentage(a));
      case "quantity-asc": return sorted.sort((a, b) => getPercentage(a) - getPercentage(b));
      default: return sorted;
    }
  }, [bottles, sortOption, customOrder, getPercentage]);

  const filteredByCategory = useMemo(() => {
    if (selectedCategory === "todos") return sortedBottles;
    return sortedBottles.filter((b) => b.category.toLowerCase() === selectedCategory.toLowerCase());
  }, [sortedBottles, selectedCategory]);

  useEffect(() => {
    if (!isDragging) setDisplayBottles(filteredByCategory);
  }, [filteredByCategory, isDragging]);

  useEffect(() => {
    if (displayBottles.length > 0 && activeIndex >= displayBottles.length) setActiveIndex(displayBottles.length - 1);
  }, [displayBottles.length, activeIndex]);

  useEffect(() => {
    setActiveIndex(0);
  }, [selectedCategory]);

  const handleStartInventory = useCallback(() => {
    setInventoryActive(true);
    setInventoryReviewedIds(new Set());
    inventoryCompletedRef.current = false;
  }, []);

  const handleBottleReviewed = useCallback((bottleId: string) => {
    setInventoryReviewedIds((prev) => new Set(prev).add(bottleId));
  }, []);

  useEffect(() => {
    if (!inventoryActive || displayBottles.length === 0 || inventoryCompletedRef.current) return;
    const total = displayBottles.length;
    const allReviewed = displayBottles.every((b) => inventoryReviewedIds.has(b.id));
    if (!allReviewed) return;
    inventoryCompletedRef.current = true;
    setInventoryActive(false);
    setInventoryReviewedIds(new Set());
    const isGeneral = selectedCategory === "todos";
    const areaName = isGeneral
      ? undefined
      : categories.find((c) => c.id === selectedCategory)?.name ?? selectedCategory;
    const inventoryType = isGeneral ? "general" : "parcial";
    const descriptionText = isGeneral
      ? "Se hizo inventario general"
      : `Se hizo inventario parcial "${areaName}"`;
    const runConfetti = () => {
      const count = 200;
      const defaults = { origin: { y: 0.6 }, zIndex: 9999 };
      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
      }
      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    };
    setTimeout(runConfetti, 100);
    movementsService.add({
      type: "inventory_complete",
      bottleId: "_",
      bottleName: "Inventario",
      newValue: total,
      userName: demoAuth.getCurrentUser()?.name ?? "Usuario",
      description: descriptionText,
    });
    notificationsService.incrementUnread();
    setLastInventoryComplete(inventoryType, areaName);
  }, [inventoryActive, inventoryReviewedIds, displayBottles, selectedCategory]);


  useEffect(() => {
    if (thumbnailScrollRef.current) {
      const thumbnail = thumbnailScrollRef.current.children[activeIndex] as HTMLElement;
      thumbnail?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeIndex, displayBottles]);

  const scrollToIndex = useCallback((index: number) => setActiveIndex(index), []);

  const getSortLabel = (opt: SortOption) => {
    switch (opt) {
      case "name-asc": return "Nombre A-Z";
      case "quantity-desc": return "Cantidad ↓";
      case "quantity-asc": return "Cantidad ↑";
      case "custom": return "Personalizado";
      default: return "Nombre A-Z";
    }
  };

  const handleSortClick = () => {
    const sortOrder: SortOption[] = ["name-asc", "quantity-desc", "quantity-asc"];
    const nextIndex = (sortOrder.indexOf(sortOption) + 1) % sortOrder.length;
    const newSort = sortOrder[nextIndex];
    setSortOption(newSort);
    setActiveIndex(0);
    movementsService.add({
      type: "sort_change",
      bottleId: "_",
      bottleName: "Inventario",
      newValue: 0,
      userName: demoAuth.getCurrentUser()?.name ?? "Usuario",
      description: `Orden de lista: ${getSortLabel(newSort)}`,
    });
  };

  const handleDragStart = (index: number) => {
    dragStartIndex.current = index;
    setDraggedIndex(index);
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragStartIndex.current == null || dragStartIndex.current === index) return;
    const newOrder = [...displayBottles];
    const [draggedItem] = newOrder.splice(dragStartIndex.current, 1);
    newOrder.splice(index, 0, draggedItem);
    setDisplayBottles(newOrder);
    dragStartIndex.current = index;
  };

  const handleDragEnd = () => {
    if (dragStartIndex.current != null) {
      const newCustomOrder = displayBottles.map((b) => b.id);
      setCustomOrder(newCustomOrder);
      setSortOption("custom");
      localStorage.setItem("bottles-custom-order", JSON.stringify(newCustomOrder));
      movementsService.add({
        type: "bottles_reorder",
        bottleId: "_",
        bottleName: "Inventario",
        newValue: 0,
        userName: demoAuth.getCurrentUser()?.name ?? "Usuario",
        description: "Orden de productos actualizado",
      });
    }
    setIsDragging(false);
    setDraggedIndex(null);
    dragStartIndex.current = null;
  };

  const handleBottleUpdate = useCallback((updatedBottle: Bottle) => {
    setDisplayBottles((prev) => prev.map((b) => (b.id === updatedBottle.id ? updatedBottle : b)));
    if (storeId) {
      const useUnits = isMeasuredInUnits(updatedBottle.category);
      const newStock = useUnits
        ? Math.max(0, Math.round(updatedBottle.currentUnits ?? 0))
        : Math.max(0, Math.floor((updatedBottle.currentOz ?? 0) / 29.57));
      // Persistir stock en la nube
      updateProductStock(storeId, updatedBottle.id, newStock, updatedBottle.name).catch(() => {
        /* ignore */
      });
      // Movimiento en la nube (edición)
      addMovementFirestore(storeId, {
        productId: updatedBottle.id,
        productName: updatedBottle.name,
        type: "edit",
        oldValue: 0,
        newValue: newStock,
        userName: demoAuth.getCurrentUser()?.name ?? "Usuario",
      }).catch(() => {
        /* ignore */
      });
    }
  }, [storeId]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-apple-text2 text-sm">Cargando inventario…</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Selector de categoría */}
      <div className="flex-shrink-0 px-4 pt-1.5 pb-1.5 bg-apple-surface border-b border-apple-border">
        <div className="w-full min-w-0 max-w-3xl sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
          <button
            type="button"
            onClick={() => setSelectedCategory("todos")}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === "todos"
                ? "bg-apple-accent text-white"
                : "bg-apple-bg text-apple-text2 hover:bg-apple-border"
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-apple-accent text-white"
                  : "bg-apple-bg text-apple-text2 hover:bg-apple-border"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-shrink-0 md:hidden py-1.5 px-4 text-center">
        <span className="text-[10px] text-apple-text2">Último inventario: {lastInventory}</span>
      </div>

      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
        <div className="w-full min-w-0 h-full max-w-3xl sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4">
          <AnimatePresence mode="wait">
            {displayBottles.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center px-6 text-center"
              >
                <p className="text-apple-text2 text-sm">
                  {selectedCategory === "todos"
                    ? "No hay productos en tu inventario"
                    : `No hay productos de ${categories.find((c) => c.id === selectedCategory)?.name ?? selectedCategory}`}
                </p>
                <p className="text-apple-text2 text-xs mt-1">
                  Añade productos desde &quot;Modifica tu inventario&quot; en Configuración
                </p>
              </motion.div>
            ) : displayBottles[activeIndex] ? (
              <motion.div
                key={`${displayBottles[activeIndex].id}-${activeIndex}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <BottleDisplay
                bottle={displayBottles[activeIndex]}
                onBottleUpdate={handleBottleUpdate}
                inventoryActive={inventoryActive}
                inventoryReviewedCount={displayBottles.filter((b) => inventoryReviewedIds.has(b.id)).length}
                inventoryTotal={displayBottles.length}
                onStartInventory={handleStartInventory}
                onBottleReviewed={handleBottleReviewed}
              />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {displayBottles.length > 0 && (
        <div className="bg-apple-surface border-t border-apple-border px-4 py-2 flex-shrink-0">
          <div className="w-full min-w-0 max-w-3xl sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-1 sm:mb-2 px-0.5 gap-1 sm:gap-2">
              <span className="text-[9px] sm:text-[10px] text-apple-text2 truncate">{getSortLabel(sortOption)}</span>
              <button
                onClick={handleSortClick}
                className="flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[9px] sm:text-[10px] text-apple-text2 bg-apple-bg border border-apple-border rounded-md hover:!bg-apple-accent hover:!text-white hover:!border-apple-accent transition-colors"
                title="Cambiar orden"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-2.5 sm:h-2.5">
                  <path d="M3 6h18M7 12h10M11 18h2" />
                </svg>
                Orden
              </button>
            </div>
            <div
              ref={thumbnailScrollRef}
              className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              onDragOver={(e) => e.preventDefault()}
            >
              {displayBottles.map((bottle, index) => (
              <BottleThumbnail
                key={`bottle-${bottle.id}-${index}`}
                bottle={bottle}
                isActive={index === activeIndex}
                onClick={() => scrollToIndex(index)}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                isDragging={isDragging && draggedIndex === index}
              />
            ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
