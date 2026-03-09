"use client";

import { useState } from "react";
import { Bottle } from "@/lib/types";
import { motion } from "framer-motion";
import InventoryVerification from "./InventoryVerification";
import PortionSelector from "./PortionSelector";
import EditableUnitField from "./EditableUnitField";
import { movementsService, notificationsService } from "@/lib/movements";
import { isMeasuredInUnits, getUnitLabel } from "@/lib/measurementRules";
import { getLastVerification, setLastVerification, formatLastVerification } from "@/lib/lastVerification";
import { getPortionForCategory } from "@/lib/portionStorage";
import { getCategoryColor, getBottleOutlineColor } from "@/lib/bottleColors";

interface BottleDisplayProps {
  bottle: Bottle;
  onBottleUpdate?: (updatedBottle: Bottle) => void;
  inventoryActive?: boolean;
  inventoryReviewedCount?: number;
  inventoryTotal?: number;
  onStartInventory?: () => void;
  onBottleReviewed?: (bottleId: string) => void;
}

const ML_TO_OZ = 0.033814;

export default function BottleDisplay({
  bottle,
  onBottleUpdate,
  inventoryActive = false,
  inventoryReviewedCount = 0,
  inventoryTotal = 0,
  onStartInventory,
  onBottleReviewed,
}: BottleDisplayProps) {
  const useUnits = isMeasuredInUnits(bottle.category);
  const unitLabel = getUnitLabel(bottle.category);
  const [lastVerifiedIso, setLastVerifiedIso] = useState<string | null>(() => getLastVerification(bottle.id));

  // Cerveza: capacidad (sizeUnits), restante (currentUnits), por pedir, %
  const capacityUnits = useUnits ? (bottle.sizeUnits ?? 100) : 0;
  const remainingUnits = useUnits
    ? (bottle.currentUnits ?? Math.round(capacityUnits * (bottle.currentOz / bottle.size)))
    : 0;
  const toOrderUnits = useUnits ? capacityUnits - remainingUnits : 0;
  const percentageUnits = useUnits && capacityUnits > 0 ? (remainingUnits / capacityUnits) * 100 : 0;

  // Licores: oz
  const sizeOz = useUnits ? 0 : bottle.size * ML_TO_OZ;
  const currentOz = useUnits ? 0 : bottle.currentOz * ML_TO_OZ;
  const percentage = useUnits ? percentageUnits : (currentOz / sizeOz) * 100;
  const remaining = useUnits ? remainingUnits : currentOz;
  const used = useUnits ? toOrderUnits : sizeOz - currentOz;
  const sizeDisplay = useUnits ? capacityUnits : sizeOz;

  const handleInventoryConfirm = (isCorrect: boolean, employeeLabel: string) => {
    movementsService.add({
      bottleId: bottle.id,
      bottleName: bottle.name,
      type: isCorrect ? "inventory_check_ok" : "inventory_check_fail",
      newValue: useUnits ? remainingUnits : remaining,
      userName: employeeLabel,
    });
    notificationsService.incrementUnread();
    if (isCorrect) {
      const iso = new Date().toISOString();
      setLastVerification(bottle.id, iso);
      setLastVerifiedIso(iso);
    }
    onBottleReviewed?.(bottle.id);
  };

  const handleReportIncorrect = (employeeLabel: string) => {
    movementsService.add({
      bottleId: bottle.id,
      bottleName: bottle.name,
      type: "inventory_check_fail",
      newValue: useUnits ? remainingUnits : remaining,
      userName: employeeLabel,
    });
    notificationsService.incrementUnread();
    onBottleReviewed?.(bottle.id);
  };

  const handleInventoryEdit = (newDisplayValue: number, employeeLabel: string) => {
    if (useUnits) {
      const newRemaining = Math.round(newDisplayValue);
      const updatedBottle: Bottle = {
        ...bottle,
        sizeUnits: capacityUnits,
        currentUnits: newRemaining,
        currentOz: capacityUnits > 0 ? (newRemaining / capacityUnits) * bottle.size : bottle.currentOz,
      };
      movementsService.add({
        bottleId: bottle.id,
        bottleName: bottle.name,
        type: "edit",
        oldValue: remainingUnits,
        newValue: newRemaining,
        userName: employeeLabel,
      });
      onBottleUpdate?.(updatedBottle);
    } else {
      const newMl = newDisplayValue / ML_TO_OZ;
      const updatedBottle = { ...bottle, currentOz: newMl };
      movementsService.add({
        bottleId: bottle.id,
        bottleName: bottle.name,
        type: "edit",
        oldValue: remaining,
        newValue: newDisplayValue,
        userName: employeeLabel,
      });
      onBottleUpdate?.(updatedBottle);
    }
    onBottleReviewed?.(bottle.id);
  };

  const applyUnitsUpdate = (newCapacity: number, newRemaining: number) => {
    const cap = Math.max(0, Math.round(newCapacity));
    const rem = Math.max(0, Math.min(cap, Math.round(newRemaining)));
    const updatedBottle: Bottle = {
      ...bottle,
      sizeUnits: cap,
      currentUnits: rem,
      currentOz: cap > 0 ? (rem / cap) * bottle.size : 0,
    };
    onBottleUpdate?.(updatedBottle);
  };

  const handleEditRemaining = (v: number, employeeLabel: string) => {
    const newRemaining = Math.round(v);
    applyUnitsUpdate(capacityUnits, newRemaining);
    movementsService.add({
      bottleId: bottle.id,
      bottleName: bottle.name,
      type: "edit",
      oldValue: remainingUnits,
      newValue: newRemaining,
      userName: employeeLabel,
    });
  };
  const handleEditCapacity = (v: number, employeeLabel: string) => {
    const newCapacity = Math.round(v);
    applyUnitsUpdate(newCapacity, remainingUnits);
    movementsService.add({
      bottleId: bottle.id,
      bottleName: bottle.name,
      type: "edit",
      oldValue: capacityUnits,
      newValue: newCapacity,
      userName: employeeLabel,
    });
  };
  const handleEditToOrder = (v: number, employeeLabel: string) => {
    const newToOrder = Math.round(v);
    const newRemaining = capacityUnits - newToOrder;
    applyUnitsUpdate(capacityUnits, Math.max(0, newRemaining));
    movementsService.add({
      bottleId: bottle.id,
      bottleName: bottle.name,
      type: "edit",
      oldValue: toOrderUnits,
      newValue: newToOrder,
      userName: employeeLabel,
    });
  };
  const handleEditPercentage = (v: number, employeeLabel: string) => {
    const newRemaining = Math.round(capacityUnits * (v / 100));
    applyUnitsUpdate(capacityUnits, Math.min(capacityUnits, Math.max(0, newRemaining)));
    movementsService.add({
      bottleId: bottle.id,
      bottleName: bottle.name,
      type: "edit",
      oldValue: Math.round(percentageUnits),
      newValue: Math.round(v),
      userName: employeeLabel,
    });
  };

  // Licores: editar capacidad total (oz), usadas (oz) o disponible (%)
  const handleEditCapacityOz = (newCapacityOz: number, employeeLabel: string) => {
    const newSizeMl = Math.max(0, newCapacityOz / ML_TO_OZ);
    const ratio = bottle.size > 0 ? bottle.currentOz / bottle.size : 1;
    const newCurrentOz = newSizeMl * ratio;
    const updatedBottle: Bottle = { ...bottle, size: newSizeMl, currentOz: newCurrentOz };
    movementsService.add({
      bottleId: bottle.id,
      bottleName: bottle.name,
      type: "edit",
      oldValue: sizeOz,
      newValue: newCapacityOz,
      userName: employeeLabel,
    });
    onBottleUpdate?.(updatedBottle);
  };

  const handleEditUsedOz = (newUsedOz: number, employeeLabel: string) => {
    const newRemainingOz = Math.max(0, sizeOz - newUsedOz);
    const newCurrentOzMl = newRemainingOz / ML_TO_OZ;
    const updatedBottle: Bottle = { ...bottle, currentOz: newCurrentOzMl };
    movementsService.add({
      bottleId: bottle.id,
      bottleName: bottle.name,
      type: "edit",
      oldValue: used,
      newValue: newUsedOz,
      userName: employeeLabel,
    });
    onBottleUpdate?.(updatedBottle);
  };

  const handleEditPercentageOz = (newPct: number, employeeLabel: string) => {
    const newCurrentOzMl = bottle.size * (Math.min(100, Math.max(0, newPct)) / 100);
    const updatedBottle: Bottle = { ...bottle, currentOz: newCurrentOzMl };
    movementsService.add({
      bottleId: bottle.id,
      bottleName: bottle.name,
      type: "edit",
      oldValue: Math.round(percentage),
      newValue: Math.round(newPct),
      userName: employeeLabel,
    });
    onBottleUpdate?.(updatedBottle);
  };

  const handlePortionChange = (portion: number, employeeLabel?: string) => {
    if (employeeLabel) {
      movementsService.add({
        bottleId: bottle.id,
        bottleName: bottle.name,
        type: "portion_change",
        newValue: portion,
        userName: employeeLabel,
      });
    }
  };

  // Determinar color según porcentaje
  const getProgressColor = () => {
    if (percentage >= 75) {
      return "from-green-500 to-green-600"; // Verde 75%-100%
    } else if (percentage >= 50) {
      return "from-yellow-500 to-yellow-600"; // Amarillo 50%-74%
    } else if (percentage >= 25) {
      return "from-red-500 to-red-600"; // Rojo 25%-49%
    } else {
      return "from-red-800 to-red-900"; // Guinda 0%-24%
    }
  };

  // Determinar color del texto según porcentaje
  const getPercentageTextColor = () => {
    if (percentage >= 75) {
      return "text-green-600"; // Verde 75%-100%
    } else if (percentage >= 50) {
      return "text-yellow-600"; // Amarillo 50%-74%
    } else if (percentage >= 25) {
      return "text-red-600"; // Rojo 25%-49%
    } else {
      return "text-red-900"; // Guinda 0%-24%
    }
  };

  const categoryColor = getCategoryColor(bottle.category);
  const outlineColor = getBottleOutlineColor(bottle.category);

  // Servicios aprox. según porción guardada por categoría
  const portionPerService = getPortionForCategory(bottle.category);
  const serviciosAprox = portionPerService > 0
    ? (useUnits
        ? Math.floor(remainingUnits / portionPerService)
        : Math.floor(remaining / portionPerService))
    : 0;

  const bodyHeight = 40;
  const liquidHeightPx = (percentage / 100) * bodyHeight;
  const liquidTopY = 56 - liquidHeightPx;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* [ Izquierda: Inventario/Verificar | Centro: Título + Botella (siempre centrados) | Derecha: Porción ] */}
      <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 md:gap-6 px-2 sm:px-3 py-2 min-h-0 min-w-0 overflow-hidden">
        {/* Izquierda: a la misma altura que la botella */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center gap-1.5 sm:gap-2 min-w-0">
          {onStartInventory != null && inventoryTotal > 0 && (
            inventoryActive ? (
              <div className="text-center min-h-[28px] flex flex-col justify-center">
                <span className="text-[10px] min-[400px]:text-xs font-semibold text-apple-accent">
                  Inventario {inventoryReviewedCount}/{inventoryTotal}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onStartInventory}
                className="px-2 py-1 min-[400px]:px-2.5 min-[400px]:py-1.5 rounded-lg bg-apple-accent text-white text-[10px] min-[400px]:text-xs font-medium hover:opacity-90 active:scale-95 transition-all shadow"
              >
                Inventario
              </button>
            )
          )}
          <InventoryVerification
            displayValue={useUnits ? remainingUnits : remaining}
            unit={useUnits ? "units" : "oz"}
            unitLabel={unitLabel}
            onConfirm={handleInventoryConfirm}
            onEdit={handleInventoryEdit}
            onReportIncorrect={handleReportIncorrect}
            lastVerifiedLabel={formatLastVerification(lastVerifiedIso)}
          />
        </div>

        {/* Centro: título + botella siempre en el mismo eje, centrados en todas las vistas */}
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="flex-1 min-w-0 flex flex-col items-center justify-center min-h-0"
        >
          <div className="text-center flex flex-col items-center w-full px-1 pb-2 sm:pb-3 flex-shrink-0">
            <h1 className="text-sm min-[400px]:text-base sm:text-lg md:text-xl font-semibold text-apple-text leading-tight truncate max-w-full">
              {bottle.name}
            </h1>
            <span className="inline-block text-[9px] min-[400px]:text-[10px] sm:text-xs text-apple-text2 bg-apple-surface px-1.5 py-0.5 rounded-full border border-apple-border mt-0.5">
              {bottle.category.toUpperCase()}
            </span>
          </div>
          <div className="relative flex flex-col items-center justify-center min-h-[140px] min-[400px]:min-h-[160px] sm:min-h-[180px] flex-shrink-0">
            <svg
              viewBox="0 0 40 64"
              className="w-auto h-[140px] min-[400px]:h-[160px] sm:h-[180px] md:h-[200px] drop-shadow-xl flex-shrink-0"
              style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.15))" }}
            >
              <defs>
                <linearGradient id={`liquid-center-${bottle.id}`} x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor={categoryColor} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={categoryColor} stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id={`glass-center-${bottle.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.5" />
                  <stop offset="50%" stopColor="#e2e8f0" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.5" />
                </linearGradient>
              </defs>
              {/* Contorno: gris si líquido clarito, si no color categoría; líquido siempre color categoría */}
              <path
                d="M18 4 L18 12 L14 16 L14 56 Q14 60 20 60 L20 60 Q26 60 26 56 L26 16 L22 12 L22 4 Z"
                fill="none"
                stroke={outlineColor}
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <path
                d="M14 16 L26 16 L26 56 Q26 60 20 60 Q14 60 14 56 Z"
                fill={`url(#glass-center-${bottle.id})`}
              />
              <path
                d={`M14 56 Q14 60 20 60 Q26 60 26 56 L26 ${liquidTopY} L14 ${liquidTopY} Z`}
                fill={`url(#liquid-center-${bottle.id})`}
              />
              <line
                x1="14"
                y1={liquidTopY}
                x2="26"
                y2={liquidTopY}
                stroke={categoryColor}
                strokeWidth="0.8"
                strokeOpacity="0.8"
              />
            </svg>
            {/* Badge porcentaje/unidades: azul como la página */}
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 min-w-[36px] text-center text-xs font-bold py-1 px-2 rounded-full shadow bg-apple-surface border border-apple-border text-apple-accent">
              {useUnits ? remainingUnits : `${Math.round(percentage)}%`}
            </div>
          </div>
        </motion.div>

        <div className="flex-shrink-0 flex items-center">
          <PortionSelector
            category={bottle.category}
            currentPortion={1}
            onPortionChange={handlePortionChange}
          />
        </div>
      </div>

      {/* Información inferior */}
      <div className="px-2 pb-1 sm:pb-2 space-y-1 sm:space-y-2 flex-shrink-0">
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] sm:text-xs font-medium text-apple-text2">Stock</span>
            <span className="text-xs sm:text-sm font-semibold text-apple-text">
              {useUnits ? remainingUnits : remaining.toFixed(1)} {unitLabel}
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-apple-text2 mb-0.5">
            {remainingUnits} unidad{remainingUnits !== 1 ? "es" : ""} en inventario
          </p>
          <div className="h-1 sm:h-1.5 bg-apple-border rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r ${getProgressColor()} rounded-full`}
            />
          </div>
        </div>
        {useUnits ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2">
            <EditableUnitField label="Unidades Restantes" value={remainingUnits} unit={unitLabel} onEdit={handleEditRemaining} />
            <EditableUnitField label="Capacidad Total" value={capacityUnits} unit={unitLabel} onEdit={handleEditCapacity} />
            <EditableUnitField label="Por Pedir" value={toOrderUnits} unit={unitLabel} onEdit={handleEditToOrder} />
            <EditableUnitField label="Disponible" value={Math.round(percentageUnits)} unit="%" isPercentage onEdit={handleEditPercentage} valueClassName={getPercentageTextColor()} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            <EditableUnitField label="Capacidad Total" value={sizeOz.toFixed(1)} unit={unitLabel} onEdit={handleEditCapacityOz} />
            <EditableUnitField label="Usadas" value={used.toFixed(1)} unit={unitLabel} onEdit={handleEditUsedOz} />
            <EditableUnitField label="Disponible" value={Math.round(percentage)} unit="%" isPercentage onEdit={handleEditPercentageOz} valueClassName={getPercentageTextColor()} />
          </div>
        )}
      </div>
    </div>
  );
}
