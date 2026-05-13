"use client";

import { motion } from "framer-motion";
import type { BeeStatus } from "@/types";

interface BeeIconProps {
  status?: BeeStatus;
  size?: number;
  className?: string;
  animate?: boolean;
}

const statusEmoji: Record<BeeStatus, string> = {
  idle: "🐝",
  searching: "🐝",
  analyzing: "🐝",
  returning: "🐝",
  resting: "😴",
  error: "💀",
  retired: "👻",
};

export default function BeeIcon({ status = "idle", size = 32, className = "", animate = true }: BeeIconProps) {
  const emoji = statusEmoji[status];
  const isActive = status === "searching" || status === "analyzing" || status === "returning";

  return (
    <motion.div
      className={`select-none ${className}`}
      style={{ fontSize: size, lineHeight: 1, width: size, height: size, textAlign: "center" }}
      animate={
        animate && isActive
          ? {
              y: [0, -4, 0, -6, 0],
              rotate: [0, 5, -3, 5, 0],
            }
          : animate && status === "idle"
          ? { y: [0, -2, 0] }
          : {}
      }
      transition={
        isActive
          ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
          : status === "idle"
          ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
          : {}
      }
    >
      {emoji}
      {/* Carrying honey indicator */}
      {status === "returning" && (
        <span className="absolute -bottom-1 -right-1 text-[0.5em]">🍯</span>
      )}
    </motion.div>
  );
}
