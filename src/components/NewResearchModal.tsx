"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NewResearchModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string, objective: string) => void;
}

const PRESETS = [
  { title: "AI Agent 行业调研", objective: "深入研究 AI Agent 行业的市场规模、技术趋势、竞争格局和投资机会", emoji: "🤖" },
  { title: "新能源汽车供应链", objective: "分析新能源汽车供应链的关键环节、核心企业和技术瓶颈", emoji: "🚗" },
  { title: "AIGC 商业化路径", objective: "调研 AIGC 在各行业的商业化落地案例、盈利模式和市场前景", emoji: "🎨" },
];

export default function NewResearchModal({ open, onClose, onCreate }: NewResearchModalProps) {
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");

  function handleCreate() {
    if (!title.trim() || !objective.trim()) return;
    onCreate(title.trim(), objective.trim());
    setTitle("");
    setObjective("");
  }

  function handlePreset(preset: (typeof PRESETS)[0]) {
    setTitle(preset.title);
    setObjective(preset.objective);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-bee-dark/60" />

          <motion.div
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg pixel-card p-0 overflow-hidden"
          >
            {/* Header */}
            <div className="game-hud px-5 py-3 flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <h2 className="font-bold text-base text-honey-300">
                  新建研究任务
                </h2>
                <p className="text-[10px] text-honey-500/70">
                  派出蜂群为你采集情报
                </p>
              </div>
              <button
                onClick={onClose}
                className="ml-auto w-7 h-7 pixel-border-sm bg-red-500 text-white flex items-center justify-center text-xs font-bold hover:bg-red-600"
              >
                ✕
              </button>
            </div>

            <div className="p-5 bg-gradient-to-b from-honey-50 to-white">
              {/* Presets */}
              <div className="mb-4">
                <label className="text-xs text-bee-dark/60 mb-2 block font-bold">
                  ⚡ 快速任务
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PRESETS.map((p) => (
                    <button
                      key={p.title}
                      onClick={() => handlePreset(p)}
                      className="pixel-btn px-3 py-1.5 bg-honey-100 text-[11px] text-bee-dark/70 hover:bg-honey-200 flex items-center gap-1"
                    >
                      {p.emoji} {p.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="mb-3">
                <label className="text-xs text-bee-dark/60 mb-1 block font-bold">
                  📜 研究标题
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="如：AI Agent 行业调研"
                  className="w-full px-3 py-2.5 pixel-border-sm bg-white text-sm focus:outline-none focus:border-honey-500"
                />
              </div>

              {/* Objective */}
              <div className="mb-5">
                <label className="text-xs text-bee-dark/60 mb-1 block font-bold">
                  🎯 研究目标
                </label>
                <textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="详细描述你想研究的方向和关注点..."
                  rows={3}
                  className="w-full px-3 py-2.5 pixel-border-sm bg-white text-sm focus:outline-none focus:border-honey-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="pixel-btn px-5 py-2 bg-gray-200 text-sm text-bee-dark/60 hover:bg-gray-300"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!title.trim() || !objective.trim()}
                  className="pixel-btn px-5 py-2 bg-honey-400 text-bee-dark text-sm font-bold
                    disabled:opacity-30 disabled:cursor-not-allowed hover:bg-honey-500"
                >
                  🐝 开始研究！
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
