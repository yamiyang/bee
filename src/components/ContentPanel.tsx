"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SwarmVisualizer from "./SwarmVisualizer";
import type { BeeAgent, KnowledgeGraph } from "@/types";

interface ContentPanelProps {
  bees: BeeAgent[];
  graph: KnowledgeGraph;
  report?: string;
  status: string;
}

type Tab = "hive" | "report";

/* ═══════════════════════════════════════════
   HTML 报告渲染器
   支持展示 AI 在 HTML 代码块外写的说明文字（preamble）
   ═══════════════════════════════════════════ */

/**
 * 从报告 HTML 中提取 preamble（代码块外的说明文字）
 * preamble 以 base64 编码存储在 <html data-preamble="..."> 或 <body data-preamble="..."> 上
 */
function extractPreamble(html: string): string {
  const match = html.match(/data-preamble="([^"]+)"/);
  if (!match) return "";
  try {
    // base64 → UTF-8 解码（TextDecoder 方式，不用 deprecated escape）
    const binStr = atob(match[1]);
    const bytes = Uint8Array.from(binStr, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

function HtmlReportViewer({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(600);
  const preamble = extractPreamble(html);
  const [showPreamble, setShowPreamble] = useState(true);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const updateHeight = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc?.body) {
          const h = doc.body.scrollHeight;
          if (h > 0) setIframeHeight(Math.max(600, h + 40));
        }
      } catch {
        // cross-origin guard
      }
    };

    iframe.addEventListener("load", updateHeight);
    const timer = setTimeout(updateHeight, 500);
    return () => {
      iframe.removeEventListener("load", updateHeight);
      clearTimeout(timer);
    };
  }, [html]);

  return (
    <div className="h-full flex flex-col">
      {/* 操作栏 — 悬浮在右上角 */}
      <div className="absolute top-3 right-4 z-30 flex gap-2">
        <button
          onClick={() => {
            const blob = new Blob([html], { type: "text/html;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "honeycomb-honey-report.html";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-3 py-1.5 text-xs font-bold rounded-full bg-white/50 text-amber-800/80 hover:bg-white/70 backdrop-blur-md border border-amber-200/40 transition-all"
        >
          ⬇️ 下载
        </button>
        <button
          onClick={() => {
            const blob = new Blob([html], { type: "text/html;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
          }}
          className="px-3 py-1.5 text-xs font-bold rounded-full bg-white/50 text-amber-800/80 hover:bg-white/70 backdrop-blur-md border border-amber-200/40 transition-all"
        >
          🔗 全屏
        </button>
      </div>

      {/* Preamble — 浮动在顶部 */}
      {preamble && showPreamble && (
        <div className="absolute top-12 left-4 right-4 z-20 bg-black/60 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10">
          <button
            onClick={() => setShowPreamble(false)}
            className="absolute top-2 right-3 text-white/40 hover:text-white text-sm"
          >✕</button>
          <div className="flex items-start gap-3">
            <span className="text-lg">🐝</span>
            <div className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">{preamble}</div>
          </div>
        </div>
      )}

      {/* iframe — 完全顶满 */}
      <iframe
        ref={iframeRef}
        srcDoc={html}
        sandbox="allow-same-origin allow-popups allow-scripts"
        className="w-full h-full flex-1"
        style={{ border: "none" }}
        title="采蜜报告"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════
   主面板 — 合并蜂群+知识图谱为「蜂巢」
   ═══════════════════════════════════════════ */
export default function ContentPanel({ bees, graph, report, status }: ContentPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("hive");

  const tabs: { id: Tab; label: string; emoji: string; enabled: boolean }[] = [
    { id: "hive", label: "蜂巢", emoji: "⬡", enabled: true },
    { id: "report", label: "报告", emoji: "📜", enabled: !!report },
  ];

  const isReportMode = activeTab === "report";

  return (
    <div className="h-full flex flex-col font-sans relative">
      {/* Tab bar — 报告模式下透明悬浮 */}
      <div className={`flex items-center gap-2 px-4 pt-3 pb-2 z-20 transition-all ${
        isReportMode
          ? "absolute top-0 left-0 right-0 bg-transparent"
          : "border-b-2 border-honey-100/50 bg-white/30 backdrop-blur-sm"
      }`}>
        <div className={`flex p-1 rounded-full border shadow-sm transition-all backdrop-blur-md ${
          isReportMode
            ? "bg-white/50 border-amber-200/40"
            : "bg-amber-100/60 border-amber-200/50"
        }`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => tab.enabled && setActiveTab(tab.id)}
              className={`px-5 py-1.5 text-xs font-bold transition-all rounded-full flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? isReportMode
                    ? "bg-amber-100/80 text-amber-900 shadow-sm border border-amber-300/50"
                    : "bg-white text-amber-800 shadow-sm border border-amber-200"
                  : tab.enabled
                  ? isReportMode
                    ? "text-amber-800/60 hover:text-amber-900 border border-transparent"
                    : "text-amber-700/70 hover:text-amber-900 border border-transparent"
                  : isReportMode
                  ? "text-amber-800/25 cursor-not-allowed border border-transparent"
                  : "text-amber-700/30 cursor-not-allowed border border-transparent"
              }`}
            >
              <span className="text-base">{tab.emoji}</span> <span>{tab.label}</span>
              {tab.id === "hive" && (bees.length > 0 || graph.nodes.length > 0) && (
                <span className={`ml-1 text-[10px] px-1.5 rounded-full ${
                  isReportMode ? "bg-amber-200/50 text-amber-800/70" : "bg-amber-200/60 text-amber-800"
                }`}>
                  {bees.filter((b) => b.status !== "retired").length}🐝 {graph.nodes.length}⬡
                </span>
              )}
              {tab.id === "report" && report && activeTab !== "report" && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-block ml-1 w-2 h-2 rounded-full bg-red-400"
                />
              )}
            </button>
          ))}
        </div>

        {/* Status badge */}
        {!isReportMode && (
          <div className="ml-auto bg-white px-3 py-1.5 rounded-full border border-honey-100 shadow-sm text-[11px] font-bold flex items-center gap-2 text-honey-700">
            {(status === "searching" || status === "planning" || status === "expanding") && (
              <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                🟡
              </motion.span>
            )}
            {status === "completed" && <span>⭐</span>}
            {status === "reporting" && <span>📝</span>}
            {status === "error" && <span>💥</span>}
            <span>
              {status === "idle" && "待命"}
              {status === "planning" && "找方向"}
              {status === "searching" && "采蜜中"}
              {status === "analyzing" && "尝味道"}
              {status === "expanding" && "找更多花"}
              {status === "reporting" && "酿蜜中"}
              {status === "completed" && "完成!"}
              {status === "paused" && "暂停"}
              {status === "error" && "出错"}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-hidden relative ${isReportMode ? "" : "p-4 pt-2"}`}>
        <AnimatePresence mode="wait">
          {activeTab === "hive" && (
            <motion.div
              key="hive"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="h-full cute-card overflow-hidden"
            >
              {bees.length === 0 && graph.nodes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-honey-800/40 gap-4">
                  <span className="text-6xl animate-bee-float opacity-50 grayscale">🐝</span>
                  <div className="text-center bg-honey-50/50 p-6 rounded-3xl border border-honey-100">
                    <p className="text-base font-extrabold mb-2 text-honey-800/60">蜜蜂们正在蜂巢里等待</p>
                    <p className="text-xs text-honey-800/40">
                      告诉蜂后你想找什么花蜜
                    </p>
                  </div>
                </div>
              ) : (
                <SwarmVisualizer bees={bees} graph={graph} />
              )}
            </motion.div>
          )}

          {activeTab === "report" && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="h-full overflow-hidden"
            >
              {report ? (
                <HtmlReportViewer html={report} />
              ) : (
                <div className="h-full cute-card flex flex-col items-center justify-center text-honey-800/40">
                  <div className="text-center">
                    <span className="text-5xl mb-4 block animate-bounce opacity-50 grayscale">📝</span>
                    <p className="font-extrabold text-honey-800/60">小蜜蜂正在拼命酿蜜中...</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
