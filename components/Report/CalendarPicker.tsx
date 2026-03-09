"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import type { ReportPeriod } from "@/lib/salesReport";

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const WEEKDAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

interface CalendarPickerProps {
  period: ReportPeriod;
  /** Para día: la fecha. Para semana: el primer día (inicio). Para mes: primer día del mes */
  value: Date;
  maxDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function CalendarPicker({
  period,
  value,
  maxDate,
  onSelect,
  onClose,
  isOpen,
}: CalendarPickerProps) {
  const [viewDate, setViewDate] = useState(() => new Date(value));
  const [viewMode, setViewMode] = useState<"days" | "months">(
    period === "month" ? "months" : "days"
  );
  const [viewYear, setViewYear] = useState(value.getFullYear());

  if (!isOpen) return null;

  const handleDayClick = (d: Date) => {
    if (period === "day") {
      onSelect(d);
      onClose();
    } else if (period === "week") {
      // El día seleccionado es el inicio de la semana (7 días: d + 6 más)
      onSelect(d);
      onClose();
    } else {
      // month: no debería estar en vista días
      onSelect(d);
      onClose();
    }
  };

  const handleMonthClick = (monthIndex: number) => {
    const d = new Date(viewYear, monthIndex, 1);
    if (period === "month") {
      onSelect(d);
      onClose();
    } else {
      setViewDate(d);
      setViewMode("days");
    }
  };

  const isDayDisabled = (d: Date) => {
    return d > maxDate;
  };

  const isDayInWeekRange = (d: Date) => {
    if (period !== "week") return false;
    const start = new Date(value);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  };

  const isDaySelected = (d: Date) => {
    if (period === "day") {
      return (
        d.getDate() === value.getDate() &&
        d.getMonth() === value.getMonth() &&
        d.getFullYear() === value.getFullYear()
      );
    }
    if (period === "week") {
      return d.getTime() === value.getTime();
    }
    return false;
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const prevMonth = () => {
    if (viewMode === "months") {
      setViewYear((y) => y - 1);
    } else {
      const d = new Date(viewDate);
      d.setMonth(d.getMonth() - 1);
      setViewDate(d);
    }
  };

  const nextMonth = () => {
    if (viewMode === "months") {
      setViewYear((y) => y + 1);
    } else {
      const d = new Date(viewDate);
      d.setMonth(d.getMonth() + 1);
      setViewDate(d);
    }
  };

  const canGoNext = viewMode === "months"
    ? viewYear < maxDate.getFullYear()
    : viewDate.getMonth() < maxDate.getMonth() || viewDate.getFullYear() < maxDate.getFullYear();

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-[min(340px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-apple-border bg-apple-surface shadow-2xl shadow-slate-900/20 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente temático */}
        <div className="relative bg-gradient-to-br from-apple-accent via-primary-600 to-apple-accent2 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_50%)]" />
          <div className="relative px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={prevMonth}
                className="p-2 rounded-xl text-white/90 hover:bg-white/20 transition-colors touch-target-min"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode(viewMode === "days" ? "months" : "days")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm transition-colors"
              >
                <Calendar className="w-4 h-4" />
                {viewMode === "months" ? (
                  viewYear
                ) : (
                  `${MONTHS_ES[month]} ${year}`
                )}
              </button>
              <button
                type="button"
                onClick={nextMonth}
                disabled={!canGoNext}
                className="p-2 rounded-xl text-white/90 hover:bg-white/20 transition-colors disabled:opacity-40 disabled:pointer-events-none touch-target-min"
                aria-label="Siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <p className="text-white/80 text-xs mt-2 text-center">
              {period === "day" && "Selecciona un día"}
              {period === "week" && "Selecciona el primer día de la semana (7 días)"}
              {period === "month" && "Selecciona un mes"}
            </p>
          </div>
        </div>

        <div className="p-4">
          {viewMode === "months" ? (
            <div className="grid grid-cols-3 gap-2">
              {MONTHS_ES.map((name, i) => {
                const d = new Date(viewYear, i, 1);
                const isDisabled = d > maxDate;
                const isSelected =
                  period === "month" &&
                  value.getMonth() === i &&
                  value.getFullYear() === viewYear;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleMonthClick(i)}
                    disabled={isDisabled}
                    className={`py-3 px-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isDisabled
                        ? "text-apple-text2/50 cursor-not-allowed"
                        : isSelected
                          ? "bg-apple-accent text-white shadow-lg shadow-apple-accent/30"
                          : "text-apple-text hover:bg-apple-bg hover:text-apple-accent"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS_ES.map((wd) => (
                  <div
                    key={wd}
                    className="text-center text-[10px] font-semibold text-apple-text2 uppercase py-1"
                  >
                    {wd}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startPad }, (_, i) => (
                  <div key={`pad-${i}`} className="aspect-square" />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const d = new Date(year, month, i + 1);
                  const disabled = isDayDisabled(d);
                  const selected = isDaySelected(d);
                  const inWeekRange = isDayInWeekRange(d) && !selected;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => !disabled && handleDayClick(d)}
                      disabled={disabled}
                      className={`aspect-square rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                        disabled
                          ? "text-apple-text2/40 cursor-not-allowed"
                          : selected
                            ? "bg-apple-accent text-white shadow-lg shadow-apple-accent/30 scale-105"
                            : inWeekRange
                              ? "bg-apple-accent/20 text-apple-accent"
                              : "text-apple-text hover:bg-apple-bg hover:text-apple-accent"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
