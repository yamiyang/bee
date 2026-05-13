"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import BeeIcon from "./BeeIcon";
import type { BeeAgent, KnowledgeGraph, KnowledgeNode } from "@/types";

interface SwarmVisualizerProps {
  bees: BeeAgent[];
  graph: KnowledgeGraph;
}

const statusLabel: Record<string, string> = {
  idle: "待命",
  searching: "搜索",
  analyzing: "分析",
  returning: "归巢",
  resting: "休息",
  error: "出错",
  retired: "退休",
};

const statusDotColor: Record<string, string> = {
  idle: "bg-gray-400",
  searching: "bg-amber-400",
  analyzing: "bg-purple-400",
  returning: "bg-green-400",
  resting: "bg-blue-300",
  error: "bg-red-400",
  retired: "bg-gray-500",
};

const nodeEmoji: Record<string, string> = {
  concept: "💡",
  entity: "🏷️",
  fact: "📌",
  insight: "✨",
  source: "🔗",
  question: "❓",
  contradiction: "⚡",
};

const nodeColor: Record<string, { fill: string; stroke: string }> = {
  concept: { fill: "#fff8d6", stroke: "#FFB300" },
  entity: { fill: "#fff0e0", stroke: "#FF8F00" },
  fact: { fill: "#e8fbe4", stroke: "#6DCE56" },
  insight: { fill: "#ffe8f0", stroke: "#FF6B9D" },
  source: { fill: "#e4f5ff", stroke: "#64D2FF" },
  question: { fill: "#f0e8ff", stroke: "#C084FC" },
  contradiction: { fill: "#ffe8ec", stroke: "#FB7185" },
};

const nodeTypeNames: Record<string, string> = {
  concept: "概念",
  entity: "实体",
  fact: "事实",
  insight: "洞察",
  source: "来源",
  question: "问题",
  contradiction: "矛盾",
};

/* ── Flat-top hexagon math ── */
const HEX_SIZE = 28; // radius from center to vertex
const HEX_W = HEX_SIZE * 2;
const HEX_H = HEX_SIZE * Math.sqrt(3);

/** Generate flat-top hexagon points string for SVG polygon */
function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(" ");
}

/**
 * Build a dense honeycomb grid from center outward (axial spiral).
 * Returns array of {q, r} axial coords → pixel {x, y}.
 */
function hexRingPositions(count: number): { x: number; y: number }[] {
  if (count === 0) return [];
  const dirs = [
    [1, 0], [0, 1], [-1, 1],
    [-1, 0], [0, -1], [1, -1],
  ];
  const results: { q: number; r: number }[] = [{ q: 0, r: 0 }];
  let ring = 1;
  while (results.length < count) {
    let q = ring;
    let r = 0;
    for (let d = 0; d < 6 && results.length < count; d++) {
      for (let s = 0; s < ring && results.length < count; s++) {
        results.push({ q, r });
        q += dirs[d][0];
        r += dirs[d][1];
      }
    }
    ring++;
  }
  // flat-top hex: x = size * 3/2 * q, y = size * sqrt(3) * (r + q/2)
  return results.map(({ q, r }) => ({
    x: HEX_SIZE * 1.5 * q,
    y: HEX_SIZE * Math.sqrt(3) * (r + q / 2),
  }));
}

/* ── Cell type definitions ── */
type CellData =
  | { kind: "hive" }
  | { kind: "bee"; bee: BeeAgent }
  | { kind: "node"; node: KnowledgeNode }
  | { kind: "empty" };

export default function SwarmVisualizer({ bees, graph }: SwarmVisualizerProps) {
  const activeBees = bees.filter((b) => b.status !== "retired");
  const retiredCount = bees.length - activeBees.length;
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);

  // Build cells: center hive → bees → knowledge nodes → empty fill
  const nodes = graph.nodes.slice(-40);
  const minCells = 1 + activeBees.length + nodes.length;
  // Fill extra empties to make a nice honeycomb
  const totalCells = Math.max(minCells, 19); // at least 2 rings
  const positions = hexRingPositions(totalCells);

  const cells: CellData[] = positions.map((_, idx) => {
    if (idx === 0) return { kind: "hive" };
    const beeIdx = idx - 1;
    if (beeIdx < activeBees.length) return { kind: "bee", bee: activeBees[beeIdx] };
    const nodeIdx = beeIdx - activeBees.length;
    if (nodeIdx < nodes.length) return { kind: "node", node: nodes[nodeIdx] };
    return { kind: "empty" };
  });

  // Calculate SVG viewBox
  const xs = positions.map((p) => p.x);
  const ys = positions.map((p) => p.y);
  const pad = HEX_SIZE + 8;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const maxX = Math.max(...xs) + pad;
  const maxY = Math.max(...ys) + pad;
  const vw = maxX - minX;
  const vh = maxY - minY;

  return (
    <div className="h-full flex gap-0">
      {/* Left: Dense Honeycomb SVG */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Stats HUD */}
        <div className="flex items-center gap-2 px-2 py-1 text-[10px] text-bee-dark/70 flex-shrink-0 flex-wrap">
          <span className="game-hud px-2 py-0.5">🐝 {activeBees.length}</span>
          {retiredCount > 0 && <span className="game-hud px-2 py-0.5">👻 {retiredCount}</span>}
          <span className="game-hud px-2 py-0.5">⬡ {graph.nodes.length}</span>
          <span className="game-hud px-2 py-0.5">🔗 {graph.edges.length}</span>
          {/* Node type legend */}
          <div className="ml-auto flex gap-1 flex-wrap">
            {Object.entries(nodeColor).map(([type, colors]) => {
              const count = graph.nodes.filter((n) => n.type === type).length;
              if (count === 0) return null;
              return (
                <span key={type} className="inline-flex items-center gap-0.5 px-1 py-0 text-[8px]"
                  style={{ background: colors.fill, border: `1px solid ${colors.stroke}` }}>
                  {nodeEmoji[type]}{nodeTypeNames[type]}×{count}
                </span>
              );
            })}
          </div>
        </div>

        {/* Honeycomb SVG */}
        <div className="flex-1 overflow-auto pixel-border bg-honey-50/30">
          <svg
            viewBox={`${minX} ${minY} ${vw} ${vh}`}
            className="w-full h-full"
            style={{ minHeight: 200 }}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Render cells */}
            {cells.map((cell, idx) => {
              const { x, y } = positions[idx];
              const pts = hexPoints(x, y, HEX_SIZE - 1);

              if (cell.kind === "hive") {
                return (
                  <g key="hive">
                    <polygon points={pts} fill="#FFD54F" stroke="#b07500" strokeWidth="2" />
                    <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" fontSize="14">🏠</text>
                  </g>
                );
              }

              if (cell.kind === "bee") {
                const bee = cell.bee;
                const isWorking = bee.status === "searching" || bee.status === "analyzing";
                const isError = bee.status === "error";
                const fill = isWorking ? "#ffecaa" : isError ? "#ffe8ec" : bee.status === "resting" ? "#e4f5ff" : "#fff8d6";
                const stroke = isWorking ? "#e09800" : isError ? "#FB7185" : bee.status === "resting" ? "#64D2FF" : "#ffc83a";
                return (
                  <g key={`bee-${bee.id}`} className="hex-cell" style={{ cursor: "default" }}>
                    <polygon points={pts} fill={fill} stroke={stroke} strokeWidth="2" />
                    <text x={x} y={y - 4} textAnchor="middle" dominantBaseline="central" fontSize="12">🐝</text>
                    <text x={x} y={y + 10} textAnchor="middle" fontSize="6" fill="#2d1f00" opacity="0.7">
                      {bee.name.slice(0, 6)}
                    </text>
                    {isWorking && (
                      <polygon points={pts} fill="none" stroke={stroke} strokeWidth="1" opacity="0.4">
                        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.2s" repeatCount="indefinite" />
                      </polygon>
                    )}
                  </g>
                );
              }

              if (cell.kind === "node") {
                const node = cell.node;
                const colors = nodeColor[node.type] || nodeColor.concept;
                const isSelected = selectedNode?.id === node.id;
                return (
                  <g key={`node-${node.id}`}
                    className="hex-cell"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedNode(isSelected ? null : node)}
                  >
                    {isSelected && (
                      <polygon points={hexPoints(x, y, HEX_SIZE + 3)} fill="none" stroke={colors.stroke} strokeWidth="2" opacity="0.5">
                        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="1s" repeatCount="indefinite" />
                      </polygon>
                    )}
                    <polygon points={pts} fill={colors.fill} stroke={colors.stroke} strokeWidth={isSelected ? 2.5 : 1.5} />
                    <text x={x} y={y - 4} textAnchor="middle" dominantBaseline="central" fontSize="10">
                      {nodeEmoji[node.type] || "💡"}
                    </text>
                    <text x={x} y={y + 10} textAnchor="middle" fontSize="6" fill="#2d1f00" opacity="0.8"
                      fontWeight={isSelected ? "bold" : "normal"}>
                      {node.label.length > 5 ? node.label.slice(0, 5) + "…" : node.label}
                    </text>
                  </g>
                );
              }

              // Empty cell
              return (
                <g key={`empty-${idx}`}>
                  <polygon points={pts} fill="#fffef5" stroke="#ffd34e" strokeWidth="0.5" opacity="0.3" />
                </g>
              );
            })}

            {/* Draw edges between connected knowledge nodes */}
            {graph.edges.map((edge) => {
              const srcNodeData = nodes.find((n) => n.id === edge.source || n.label === edge.source);
              const tgtNodeData = nodes.find((n) => n.id === edge.target || n.label === edge.target);
              if (!srcNodeData || !tgtNodeData) return null;
              const srcIdx = nodes.indexOf(srcNodeData) + 1 + activeBees.length;
              const tgtIdx = nodes.indexOf(tgtNodeData) + 1 + activeBees.length;
              if (srcIdx >= positions.length || tgtIdx >= positions.length) return null;
              const p1 = positions[srcIdx];
              const p2 = positions[tgtIdx];
              const edgeColor = edge.type === "contradicts" ? "#FB7185" : edge.type === "causes" ? "#FF8F00" : "#ffc83a";
              return (
                <line key={edge.id}
                  x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                  stroke={edgeColor} strokeWidth="1" opacity="0.4"
                  strokeDasharray={edge.type === "contradicts" ? "3,3" : "none"}
                />
              );
            })}
          </svg>
        </div>

        {/* Selected node detail */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex-shrink-0 p-2 pixel-card text-[11px] overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-1">
                <span>{nodeEmoji[selectedNode.type]}</span>
                <span className="font-bold text-bee-dark">{selectedNode.label}</span>
                <span className="pixel-tag text-[8px]"
                  style={{
                    background: nodeColor[selectedNode.type]?.fill,
                    borderColor: nodeColor[selectedNode.type]?.stroke,
                  }}>
                  {nodeTypeNames[selectedNode.type]}
                </span>
                <span className="ml-auto text-bee-dark/40 text-[9px]">
                  R{selectedNode.round} | W{selectedNode.weight.toFixed(1)}
                </span>
                <button onClick={() => setSelectedNode(null)} className="text-bee-dark/30 hover:text-bee-dark font-bold">✕</button>
              </div>
              <p className="text-bee-dark/70 leading-relaxed">{selectedNode.content}</p>
              {graph.edges.filter(
                (e) => e.source === selectedNode.id || e.target === selectedNode.id ||
                       e.source === selectedNode.label || e.target === selectedNode.label
              ).length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {graph.edges
                    .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id ||
                                   e.source === selectedNode.label || e.target === selectedNode.label)
                    .slice(0, 6)
                    .map((edge) => {
                      const other = (edge.source === selectedNode.id || edge.source === selectedNode.label)
                        ? graph.nodes.find((n) => n.id === edge.target || n.label === edge.target)?.label || edge.target
                        : graph.nodes.find((n) => n.id === edge.source || n.label === edge.source)?.label || edge.source;
                      return (
                        <span key={edge.id} className="pixel-tag text-[8px] border-honey-400 bg-honey-50 text-bee-dark/60">
                          {edge.type} → {other}
                        </span>
                      );
                    })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Bee list */}
      <div className="w-[200px] flex-shrink-0 border-l-2 border-bee-dark/20 flex flex-col bg-white/40">
        <div className="px-2 py-1.5 text-[10px] font-bold text-bee-dark/50 border-b border-honey-200 flex-shrink-0">
          🐝 蜜蜂列表 ({bees.length})
        </div>
        <div className="flex-1 overflow-y-auto">
          {bees.map((bee) => (
            <div
              key={bee.id}
              className="flex items-center gap-1.5 px-2 py-1.5 border-b border-honey-100 text-[10px] hover:bg-honey-50 transition-colors"
            >
              <span className={`w-1.5 h-1.5 flex-shrink-0 ${statusDotColor[bee.status]}`} />
              <BeeIcon status={bee.status} size={14} animate={false} />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-bee-dark truncate">{bee.name}</div>
                <div className="text-bee-dark/40 truncate text-[9px]">{bee.task.query.slice(0, 20)}</div>
              </div>
              <span className="text-[8px] text-bee-dark/40 flex-shrink-0">
                [{statusLabel[bee.status]}]
              </span>
              {bee.findings.length > 0 && (
                <span className="text-honey-600 font-bold text-[8px] flex-shrink-0">
                  🍯{bee.findings.length}
                </span>
              )}
            </div>
          ))}
          {bees.length === 0 && (
            <div className="flex items-center justify-center h-full text-bee-dark/20 text-[10px] p-4">
              等待派遣...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
