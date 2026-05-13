"use client";

import { motion } from "framer-motion";

interface HexagonNodeProps {
  label: string;
  type?: string;
  size?: number;
  filled?: boolean;
  glowing?: boolean;
  onClick?: () => void;
}

const typeColors: Record<string, { fill: string; stroke: string }> = {
  concept: { fill: "#fff8d6", stroke: "#FFB300" },
  entity: { fill: "#fff0e0", stroke: "#FF8F00" },
  fact: { fill: "#e8fbe4", stroke: "#6DCE56" },
  source: { fill: "#e4f5ff", stroke: "#64D2FF" },
  topic: { fill: "#ffe8f0", stroke: "#FF8FAB" },
  insight: { fill: "#ffe8f0", stroke: "#FF6B9D" },
  question: { fill: "#f0e8ff", stroke: "#C084FC" },
};

const typeEmoji: Record<string, string> = {
  concept: "💡",
  entity: "🏷️",
  fact: "📌",
  source: "🔗",
  topic: "📂",
  insight: "✨",
  question: "❓",
};

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(" ");
}

export default function HexagonNode({
  label,
  type = "concept",
  size = 60,
  filled = true,
  glowing = false,
  onClick,
}: HexagonNodeProps) {
  const colors = typeColors[type] || typeColors.concept;
  const w = size;
  const h = size * 1.15;
  const r = size * 0.48;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative cursor-pointer group"
      style={{ width: w, height: h }}
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
    >
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="absolute inset-0">
        {glowing && (
          <polygon
            points={hexPoints(w / 2, h / 2, r + 4)}
            fill={colors.stroke + "30"}
            stroke="none"
          >
            <animate attributeName="opacity" values="0.5;0.2;0.5" dur="1.5s" repeatCount="indefinite" />
          </polygon>
        )}
        <polygon
          points={hexPoints(w / 2, h / 2, r)}
          fill={filled ? colors.fill : "transparent"}
          stroke={colors.stroke}
          strokeWidth="2"
          opacity={filled ? 1 : 0.5}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1">
        <span className="text-sm">{typeEmoji[type] || "💡"}</span>
        <span
          className="font-bold text-bee-dark leading-tight line-clamp-1 drop-shadow-sm"
          style={{ fontSize: Math.max(8, size * 0.13) }}
        >
          {label.length > 6 ? label.slice(0, 6) + "…" : label}
        </span>
      </div>
    </motion.div>
  );
}
