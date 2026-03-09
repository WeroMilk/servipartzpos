"use client";

import { motion } from "framer-motion";

export default function BottleSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center gap-5">
        {/* Logo + spinner formal */}
        <div className="relative flex items-center justify-center">
          <motion.div
            className="w-12 h-12 rounded-full border-2 border-apple-accent border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <div className="text-center">
          <p className="text-apple-text font-semibold text-xl tracking-tight">
            MiBarra
          </p>
          <p className="text-apple-text2 text-sm mt-1">
            Cargando…
          </p>
        </div>
      </div>
      <div className="h-0.5 w-28 rounded-full bg-apple-border overflow-hidden">
        <motion.div
          className="h-full bg-apple-accent rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: ["0%", "100%"] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
