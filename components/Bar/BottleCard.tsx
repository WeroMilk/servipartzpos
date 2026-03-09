"use client";

import { Bottle } from "@/lib/types";
import { motion } from "framer-motion";
import { isMeasuredInUnits, getUnitLabel } from "@/lib/measurementRules";

interface BottleCardProps {
  bottle: Bottle;
  isActive: boolean;
}

const ML_TO_OZ = 0.033814;

export default function BottleCard({ bottle, isActive }: BottleCardProps) {
  const useUnits = isMeasuredInUnits(bottle.category);
  const unitLabel = getUnitLabel(bottle.category);

  const capacityUnits = useUnits ? (bottle.sizeUnits ?? 100) : 0;
  const remainingUnits = useUnits
    ? (bottle.currentUnits ?? Math.round(capacityUnits * (bottle.currentOz / bottle.size)))
    : 0;
  const toOrderUnits = useUnits ? capacityUnits - remainingUnits : 0;
  const percentageUnits = useUnits && capacityUnits > 0 ? (remainingUnits / capacityUnits) * 100 : 0;

  const sizeOz = useUnits ? 0 : bottle.size * ML_TO_OZ;
  const currentOz = useUnits ? 0 : bottle.currentOz * ML_TO_OZ;
  const percentage = useUnits ? percentageUnits : (currentOz / sizeOz) * 100;
  const remaining = useUnits ? remainingUnits : currentOz;
  const used = useUnits ? toOrderUnits : sizeOz - currentOz;
  const sizeDisplay = useUnits ? capacityUnits : sizeOz;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{
        scale: isActive ? 1 : 0.85,
        opacity: isActive ? 1 : 0.6,
      }}
      transition={{ duration: 0.3 }}
      className="flex-shrink-0 w-full px-4"
    >
      <div className="bg-bar-darkWood/80 backdrop-blur-sm rounded-3xl border-2 border-bar-wine/40 p-6 shadow-2xl">
        {/* Información superior */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-bar-gold mb-1">
            {bottle.name}
          </h2>
          <p className="text-gray-300 text-sm">{bottle.brand}</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <span className="text-xs text-gray-400 bg-bar-black/50 px-3 py-1 rounded-full">
              {bottle.category.toUpperCase()}
            </span>
            <span className="text-xs text-gray-400 bg-bar-black/50 px-3 py-1 rounded-full">
              {useUnits ? `${sizeDisplay} ${unitLabel}` : `${sizeDisplay.toFixed(1)} ${unitLabel}`}
            </span>
          </div>
        </div>

        {/* Botella visual */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-32 h-64 bg-gradient-to-b from-bar-wine/20 to-bar-darkWine/20 rounded-lg border-2 border-bar-wine/30 flex items-end justify-center overflow-hidden">
              {/* Líquido dentro de la botella */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${percentage}%` }}
                transition={{ duration: 0.5 }}
                className="w-full bg-gradient-to-t from-bar-wine to-bar-darkWine rounded-b-lg"
                style={{
                  background: `linear-gradient(to top, #722F37 ${percentage}%, transparent ${percentage}%)`,
                }}
              />
            </div>
            {/* Etiqueta de la botella */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-bar-black/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-bar-gold/30">
                <p className="text-bar-gold font-bold text-lg">
                  {Math.round(percentage)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Información inferior - Medidores */}
        <div className="space-y-4">
          {/* Medidor restantes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300 font-medium">
                {useUnits ? "Unidades Restantes" : "Onzas Restantes"}
              </span>
              <span className="text-lg font-bold text-bar-gold">
                {useUnits ? remaining : remaining.toFixed(1)} {unitLabel}
              </span>
            </div>
            <div className="h-3 bg-bar-black/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-bar-gold to-bar-wine rounded-full"
              />
            </div>
          </div>

          {/* Medidor usadas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300 font-medium">
                {useUnits ? "Por Pedir" : "Onzas Usadas"}
              </span>
              <span className="text-lg font-bold text-bar-wine">
                {useUnits ? used : used.toFixed(1)} {unitLabel}
              </span>
            </div>
            <div className="h-3 bg-bar-black/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${100 - percentage}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-bar-wine to-bar-darkWine rounded-full"
              />
            </div>
          </div>

          {/* Información adicional */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-bar-black/40 rounded-lg p-3 border border-bar-wine/20">
              <p className="text-xs text-gray-400 mb-1">Capacidad Total</p>
              <p className="text-white font-semibold">{useUnits ? `${sizeDisplay} ${unitLabel}` : `${sizeDisplay.toFixed(1)} ${unitLabel}`}</p>
            </div>
            <div className="bg-bar-black/40 rounded-lg p-3 border border-bar-wine/20">
              <p className="text-xs text-gray-400 mb-1">Disponible</p>
              <p className="text-white font-semibold">
                {percentage.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
