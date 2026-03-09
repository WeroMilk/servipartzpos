"use client";

import { Bottle } from "@/lib/types";
import { motion } from "framer-motion";
import { getPortionForCategory } from "@/lib/portionStorage";
import { getCategoryColor, getBottleOutlineColor } from "@/lib/bottleColors";
import { getProductImageUrl } from "@/lib/productImages";
import Image from "next/image";

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
  const sizeUnits = bottle.sizeUnits ?? 100;
  const currentUnits = bottle.currentUnits ?? Math.round(sizeUnits * (bottle.currentOz / bottle.size));

  // Repuestos: nivel por unidades
  const percentage = sizeUnits > 0 ? Math.min(100, (currentUnits / sizeUnits) * 100) : 0;

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

  // Unidades disponibles (repuestos)
  const portion = getPortionForCategory(bottle.category);
  const unidadesAprox = portion > 0 ? Math.floor(currentUnits / portion) : currentUnits;

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
      {/* Icono de producto/repuesto */}
      <div className="relative w-10 h-14 sm:w-12 sm:h-16 flex items-end justify-center mb-1.5">
        {getProductImageUrl(bottle.id) ? (
          <div className="relative w-full h-full rounded-lg overflow-hidden bg-white border border-apple-border/50">
            <Image
              src={getProductImageUrl(bottle.id)!}
              alt={bottle.name}
              fill
              className="object-contain p-0.5"
              sizes="48px"
            />
          </div>
        ) : (
          <svg
            viewBox="0 0 48 48"
            className="w-full h-full drop-shadow-sm"
            style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))" }}
          >
            <defs>
              <linearGradient id={`box-fill-${bottle.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={categoryColor} stopOpacity="0.9" />
                <stop offset="100%" stopColor={categoryColor} stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <path
              d="M8 14 L24 6 L40 14 L40 34 L24 42 L8 34 Z"
              fill={`url(#box-fill-${bottle.id})`}
              stroke={outlineColor}
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <path d="M8 14 L24 22 L40 14" fill="none" stroke={outlineColor} strokeWidth="0.8" strokeOpacity="0.8" />
            <path d="M24 6 L24 42" fill="none" stroke={outlineColor} strokeWidth="0.6" strokeOpacity="0.6" />
          </svg>
        )}
        {/* Badge: unidades (color por nivel) */}
        <div
          className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 min-w-[28px] text-center text-[9px] font-bold py-0.5 px-1.5 rounded-full shadow ${badgeStyle.bg} ${badgeStyle.text}`}
        >
          {currentUnits}
        </div>
      </div>

      {/* Nombre */}
      <p className="text-[10px] sm:text-xs font-semibold text-center max-w-[52px] sm:max-w-[56px] truncate text-gray-700">
        {bottle.name.split(" ").slice(0, 2).join(" ")}
      </p>
      <p className="text-[8px] sm:text-[9px] text-apple-text2 text-center">
        {unidadesAprox} unid
      </p>
    </motion.button>
  );
}
