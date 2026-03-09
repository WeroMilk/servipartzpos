"use client";

import Image from "next/image";
import { Bottle } from "@/lib/types";
import { Check } from "lucide-react";
import { getCategoryColor } from "@/lib/bottleColors";

interface BottleCardProps {
  bottle: Bottle;
  isSelected: boolean;
  onClick: () => void;
}

function BottleIconSvg({ bottle, categoryColor }: { bottle: Bottle; categoryColor: string }) {
  const gradId = `bottleGrad-${bottle.id}`;
  const shadowId = `shadow-${bottle.id}`;
  return (
    <svg width="140" height="220" viewBox="0 0 140 220" className="max-h-full w-auto max-w-full object-contain drop-shadow-md" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={categoryColor} stopOpacity={0.3} />
          <stop offset="50%" stopColor={categoryColor} stopOpacity={0.5} />
          <stop offset="100%" stopColor={categoryColor} stopOpacity={0.2} />
        </linearGradient>
        <filter id={shadowId}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx="70" cy="210" rx="35" ry="8" fill="#000" opacity={0.1} />
      <rect x="50" y="15" width="40" height="180" rx="8" fill={`url(#${gradId})`} filter={`url(#${shadowId})`} />
      <rect x="55" y="20" width="30" height="170" rx="6" fill={categoryColor} opacity={0.4} />
      <rect x="60" y="80" width="20" height="30" rx="2" fill="#fff" opacity={0.9} />
      <rect x="62" y="82" width="16" height="26" rx="1" fill={categoryColor} opacity={0.1} />
      <rect x="65" y="8" width="10" height="12" rx="2" fill="#8B7355" opacity={0.8} />
      <rect x="58" y="25" width="8" height="140" rx="2" fill="#fff" opacity={0.2} />
    </svg>
  );
}

export default function BottleCard({ bottle, isSelected, onClick }: BottleCardProps) {
  const categoryColor = getCategoryColor(bottle.category);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full min-w-0 h-full min-h-0 max-h-full rounded-lg min-[380px]:rounded-xl border-2 transition-colors duration-200 overflow-hidden flex flex-col shrink-0 ${
        isSelected
          ? "border-apple-accent bg-apple-accent/5 shadow-md"
          : "border-apple-border bg-apple-surface hover:border-apple-accent"
      }`}
      style={{ aspectRatio: "unset" }}
    >
      {isSelected && (
        <div className="absolute top-1 right-1 min-[380px]:top-1.5 min-[380px]:right-1.5 z-10">
          <div className="w-4 h-4 min-[380px]:w-5 min-[380px]:h-5 bg-apple-accent rounded-full flex items-center justify-center shadow">
            <Check className="w-2.5 h-2.5 min-[380px]:w-3 min-[380px]:h-3 text-white" />
          </div>
        </div>
      )}

      <div className="p-1 min-[380px]:p-1.5 sm:p-2 flex flex-col items-center flex-1 min-h-0 min-w-0 overflow-hidden w-full">
        <div className="w-full min-w-0 flex-shrink-0 text-center h-[1.75rem] min-[380px]:h-[2rem] sm:h-[2.25rem] flex flex-col justify-center overflow-hidden">
          <h3
            className={`font-semibold text-[10px] min-[380px]:text-[11px] sm:text-xs leading-tight line-clamp-2 text-apple-text overflow-hidden text-ellipsis break-words ${
              isSelected ? "!text-apple-accent" : ""
            }`}
            title={bottle.name}
          >
            {bottle.name}
          </h3>
        </div>

        <div className="w-full flex-shrink-0 h-7 min-[380px]:h-8 sm:h-9 md:h-10 flex items-center justify-center max-h-7 min-[380px]:max-h-8 sm:max-h-9 md:max-h-10 mt-0.5 min-[380px]:mt-1">
          {bottle.image ? (
            <Image
              src={bottle.image}
              alt={bottle.name}
              width={140}
              height={220}
              className="max-h-full w-auto max-w-full object-contain object-center drop-shadow-md"
              loading="lazy"
              unoptimized
            />
          ) : (
            <BottleIconSvg bottle={bottle} categoryColor={categoryColor} />
          )}
        </div>

        <p className="text-[9px] min-[380px]:text-[10px] text-apple-text2 flex-shrink-0 mt-0.5 leading-none">
          {bottle.size} ml
        </p>
      </div>
    </button>
  );
}
