"use client";

import { Bottle } from "@/lib/types";
import { motion } from "framer-motion";
import { getPortionForCategory } from "@/lib/portionStorage";
import { getCategoryColor, getBottleOutlineColor } from "@/lib/bottleColors";

interface BottleThumbnailProps {
  bottle: Bottle;
  isActive: boolean;
  onClick: () => void;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

export default function BottleThumbnail({
  bottle,
  isActive,
  onClick,
  draggable = false,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging = false,
}: BottleThumbnailProps) {
  const isCerveza = bottle.category.toLowerCase() === "cerveza";
  const sizeUnits = bottle.sizeUnits ?? (isCerveza ? 100 : 1);
  const currentUnits = bottle.currentUnits ?? (isCerveza ? Math.round(sizeUnits * (bottle.currentOz / bottle.size)) : 0);

  const mlToOz = (ml: number) => ml * 0.033814;
  const sizeOz = mlToOz(bottle.size);
  const currentOz = mlToOz(bottle.currentOz);

  // Cerveza: nivel por unidades; resto: por porcentaje de ml
  const percentage = isCerveza
    ? (sizeUnits > 0 ? Math.min(100, (currentUnits / sizeUnits) * 100) : 0)
    : Math.min(100, Math.max(0, (currentOz / sizeOz) * 100));

  const categoryColor = getCategoryColor(bottle.category);
  const outlineColor = getBottleOutlineColor(bottle.category);
  // Badge (porcentajes y unidades): color según % restante — verde >75%, amarillo 50-74%, rojo 25-49%, guinda <25%
  const getBadgeStyle = () => {
    if (percentage > 75) return { bg: "bg-green-500", text: "text-white" };
    if (percentage >= 50) return { bg: "bg-yellow-500", text: "text-gray-900" };
    if (percentage >= 25) return { bg: "bg-red-500", text: "text-white" };
    return { bg: "bg-red-900", text: "text-white" }; // guinda bajo 25%
  };
  const badgeStyle = getBadgeStyle();

  // Altura del líquido en el cuerpo de la botella
  const bodyHeight = 40;
  const liquidHeightPx = (percentage / 100) * bodyHeight;
  const liquidTopY = 56 - liquidHeightPx;

  // Servicios aprox. (solo en miniaturas, mismo criterio que vista principal)
  const portion = getPortionForCategory(bottle.category);
  const serviciosAprox = portion > 0
    ? (isCerveza
        ? Math.floor(currentUnits / portion)
        : Math.floor(currentOz / portion))
    : 0;

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`flex-shrink-0 flex flex-col items-center p-2 rounded-2xl transition-all min-w-[56px] sm:min-w-[64px] border-2 ${
        isActive
          ? "bg-apple-accent/20 border-apple-accent"
          : "bg-white/60 hover:bg-white border-transparent hover:border-gray-300"
      } ${isDragging ? "opacity-50 cursor-grabbing" : draggable ? "cursor-grab" : ""}`}
    >
      {/* Botella con líquido */}
      <div className="relative w-10 h-14 sm:w-12 sm:h-16 flex items-end justify-center mb-1.5">
        <svg
          viewBox="0 0 40 64"
          className="w-full h-full drop-shadow-sm"
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))" }}
        >
          <defs>
            <linearGradient id={`liquid-${bottle.id}`} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={categoryColor} stopOpacity="0.9" />
              <stop offset="100%" stopColor={categoryColor} stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id={`glass-${bottle.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#e2e8f0" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          {/* Contorno botella: gris si líquido clarito, si no color categoría */}
          <path
            d="M18 4 L18 12 L14 16 L14 56 Q14 60 20 60 L20 60 Q26 60 26 56 L26 16 L22 12 L22 4 Z"
            fill="none"
            stroke={outlineColor}
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
          {/* Cuerpo relleno (vidrio claro) */}
          <path
            d="M14 16 L26 16 L26 56 Q26 60 20 60 Q14 60 14 56 Z"
            fill={`url(#glass-${bottle.id})`}
          />
          {/* Líquido desde abajo: color por categoría */}
          <path
            d={`M14 56 Q14 60 20 60 Q26 60 26 56 L26 ${liquidTopY} L14 ${liquidTopY} Z`}
            fill={`url(#liquid-${bottle.id})`}
          />
          <line
            x1="14"
            y1={liquidTopY}
            x2="26"
            y2={liquidTopY}
            stroke={categoryColor}
            strokeWidth="0.6"
            strokeOpacity="0.8"
          />
        </svg>
        {/* Badge: cerveza = unidades, resto = porcentaje (color por nivel) */}
        <div
          className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 min-w-[28px] text-center text-[9px] font-bold py-0.5 px-1.5 rounded-full shadow ${badgeStyle.bg} ${badgeStyle.text}`}
        >
          {isCerveza ? currentUnits : `${Math.round(percentage)}%`}
        </div>
      </div>

      {/* Nombre */}
      <p className="text-[10px] sm:text-xs font-semibold text-center max-w-[52px] sm:max-w-[56px] truncate text-gray-700">
        {bottle.name.split(" ")[0]}
      </p>
      <p className="text-[8px] sm:text-[9px] text-apple-text2 text-center">
        ~{serviciosAprox} serv.
      </p>
    </motion.button>
  );
}
