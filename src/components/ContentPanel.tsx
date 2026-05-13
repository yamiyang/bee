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
   ═══════════════════════════════════════════ */
function HtmlReportViewer({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(600);

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
    <div className="h-full flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-bee-dark/50">📄 研究报告</span>
        <button
          onClick={() => {
            const blob = new Blob([html], { type: "text/html;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "argus-research-report.html";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="ml-auto pixel-btn px-3 py-1 bg-honey-200 text-xs text-bee-dark/60"
        >
          ⬇️ 下载
        </button>
        <button
          onClick={() => {
            const blob = new Blob([html], { type: "text/html;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
          }}
          className="pixel-btn px-3 py-1 bg-honey-200 text-xs text-bee-dark/60"
        >
          🔗 新窗口
        </button>
      </div>
      <iframe
        ref={iframeRef}
        srcDoc={html}
        sandbox="allow-same-origin allow-popups"
        className="flex-1 w-full pixel-border bg-white"
        style={{ minHeight: `${iframeHeight}px` }}
        title="研究报告"
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

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 pt-3 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => tab.enabled && setActiveTab(tab.id)}
            className={`px-4 py-1.5 text-[11px] font-bold transition-all ${
              activeTab === tab.id
                ? "pixel-btn bg-honey-400 text-bee-dark"
                : tab.enabled
                ? "pixel-border-sm text-bee-dark/60 bg-white hover:bg-honey-100"
                : "text-bee-dark/20 cursor-not-allowed border-2 border-transparent"
            }`}
          >
            {tab.emoji} {tab.label}
            {tab.id === "hive" && (bees.length > 0 || graph.nodes.length > 0) && (
              <span className="ml-1 text-[9px] opacity-60">
                ({bees.filter((b) => b.status !== "retired").length}🐝 {graph.nodes.length}⬡)
              </span>
            )}
            {tab.id === "report" && report && activeTab !== "report" && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-block ml-1 w-2 h-2 bg-red-400 border border-bee-dark"
              />
            )}
          </button>
        ))}

        {/* Status badge */}
        <div className="ml-auto game-hud px-2 py-1 text-[9px] flex items-center gap-1.5">
          {(status === "searching" || status === "planning" || status === "expanding") && (
            <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
              🟡
            </motion.span>
          )}
          {status === "completed" && <span>⭐</span>}
          {status === "reporting" && <span>📝</span>}
          {status === "error" && <span>💥</span>}
          <span>
            {status === "idle" && "待命"}
            {status === "planning" && "规划中"}
            {status === "searching" && "搜索中"}
            {status === "analyzing" && "分析中"}
            {status === "expanding" && "深化中"}
            {status === "reporting" && "出报告"}
            {status === "completed" && "完成!"}
            {status === "paused" && "暂停"}
            {status === "error" && "出错"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "hive" && (
            <motion.div
              key="hive"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="h-full"
            >
              {bees.length === 0 && graph.nodes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-bee-dark/30 gap-3">
                  <span className="text-5xl">🐝</span>
                  <div className="pixel-card p-4 text-center">
                    <p className="text-sm font-bold mb-1">蜜蜂们正在蜂巢里等待</p>
                    <p className="text-xs text-bee-dark/40">
                      输入研究目标即可派出蜂群
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="h-full overflow-auto"
            >
              {report ? (
                <HtmlReportViewer html={report} />
              ) : (
                <div className="h-full flex items-center justify-center text-bee-dark/30 text-sm">
                  <div className="text-center">
                    <span className="text-4xl mb-3 block">📝</span>
                    <p>报告生成中...</p>
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
