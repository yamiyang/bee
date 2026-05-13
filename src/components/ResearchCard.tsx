"use client";

import { motion } from "framer-motion";
import type { Research } from "@/types";

interface ResearchCardProps {
  research: Research;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const statusConfig: Record<string, { label: string; emoji: string; color: string }> = {
  idle: { label: "待命", emoji: "💤", color: "text-bee-dark/40" },
  planning: { label: "规划中", emoji: "🧠", color: "text-purple-600" },
  searching: { label: "搜索中", emoji: "🔍", color: "text-amber-600" },
  analyzing: { label: "分析中", emoji: "📊", color: "text-blue-600" },
  expanding: { label: "深化中", emoji: "🔄", color: "text-cyan-600" },
  reporting: { label: "出报告", emoji: "📝", color: "text-purple-600" },
  completed: { label: "已完成", emoji: "⭐", color: "text-green-600" },
  paused: { label: "已暂停", emoji: "⏸️", color: "text-gray-500" },
  error: { label: "出错", emoji: "💥", color: "text-red-600" },
};

export default function ResearchCard({ research, onClick, onDelete }: ResearchCardProps) {
  const status = statusConfig[research.status] || statusConfig.idle;
  const findingsCount = research.bees.reduce((acc, b) => acc + b.findings.length, 0);
  const level = Math.min(99, research.bees.length + research.graph.nodes.length + findingsCount);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onClick={onClick}
      className="relative pixel-card p-4 cursor-pointer group transition-all"
    >
      {/* Delete */}
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 w-6 h-6 pixel-border-sm bg-red-400 text-white 
          opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center
          hover:bg-red-500 text-xs font-bold"
      >
        ✕
      </button>

      {/* Level */}
      <div className="absolute -top-2 -left-2 w-8 h-8 pixel-border-sm bg-honey-400 text-bee-dark 
        flex items-center justify-center text-[10px] font-bold z-10">
        {level}
      </div>

      {/* Title */}
      <div className="flex items-start gap-2 mt-1">
        <span className="text-lg flex-shrink-0">📜</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-bee-dark pr-6 line-clamp-1">{research.title}</h3>
          <p className="text-[11px] text-bee-dark/50 line-clamp-2 mt-0.5">{research.objective}</p>
        </div>
      </div>

      {/* Status */}
      <div className="mt-3 flex items-center gap-2">
        <span className={`pixel-tag border-current ${status.color} bg-white/80 flex items-center gap-1`}>
          {status.emoji} {status.label}
        </span>
      </div>

      {/* Stats */}
      <div className="mt-2 flex items-center gap-3 text-[11px] text-bee-dark/60">
        {research.bees.length > 0 && <span>🐝×{research.bees.length}</span>}
        {findingsCount > 0 && <span>🍯×{findingsCount}</span>}
        {research.graph.nodes.length > 0 && <span>⬡{research.graph.nodes.length}</span>}
        <span className="ml-auto text-[10px]">
          {new Date(research.updatedAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
        </span>
      </div>

      {/* XP bar */}
      <div className="mt-2 h-2 bg-bee-dark/10 border border-bee-dark/20">
        <motion.div
          className="h-full bg-gradient-to-r from-honey-400 to-honey-500"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, level)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}
