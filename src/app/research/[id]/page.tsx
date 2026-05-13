"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useResearchStore } from "@/store/research-store";
import ChatPanel from "@/components/ChatPanel";
import ContentPanel from "@/components/ContentPanel";
import FlowerFieldPanel from "@/components/FlowerFieldPanel";
import { runSwarmResearch, stopResearch } from "@/engine/swarm";

type RightPanel = "content" | "flowers";

export default function ResearchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const research = useResearchStore((s) => s.researches.find((r) => r.id === id));
  const addMessage = useResearchStore((s) => s.addMessage);
  const setActiveResearch = useResearchStore((s) => s.setActiveResearch);
  const initFlowerField = useResearchStore((s) => s.initFlowerField);

  const [isProcessing, setIsProcessing] = useState(false);
  const [rightPanel, setRightPanel] = useState<RightPanel>("content");

  const handleStop = useCallback(() => {
    if (!research) return;
    const stopped = stopResearch(id);
    if (stopped) {
      addMessage(id, { role: "system", content: "🛑 正在停止研究..." });
    }
  }, [id, research, addMessage]);

  useEffect(() => {
    initFlowerField();
  }, [initFlowerField]);

  useEffect(() => {
    setActiveResearch(id);
    return () => setActiveResearch(null);
  }, [id, setActiveResearch]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!research || isProcessing) return;
      addMessage(id, { role: "user", content: text });

      if (research.status === "idle" || research.status === "completed" || research.status === "error") {
        setIsProcessing(true);
        try {
          await runSwarmResearch(id, text);
        } catch (err) {
          console.error("Swarm error:", err);
          addMessage(id, { role: "system", content: `💥 研究出错: ${err instanceof Error ? err.message : "未知错误"}` });
        }
        setIsProcessing(false);
      } else {
        addMessage(id, {
          role: "queen",
          content: `📩 收到指令：「${text}」\n当前研究正在进行中，请等待完成后再发起新的研究。`,
        });
      }
    },
    [research, isProcessing, id, addMessage]
  );

  if (!research) {
    return (
      <div className="min-h-screen bg-honey-50 flex items-center justify-center">
        <div className="pixel-card p-8 text-center">
          <div className="text-5xl mb-4">🐝❓</div>
          <p className="text-bee-dark/60 mb-4 font-bold">找不到这个研究任务</p>
          <button onClick={() => router.push("/")} className="pixel-btn px-4 py-2 bg-honey-400 text-bee-dark text-sm">
            🏠 返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-honey-50">
      {/* Header */}
      <header className="flex-shrink-0 game-hud z-20">
        <div className="px-4 py-2 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="pixel-btn px-2 py-1 bg-honey-700 text-honey-300 text-xs"
          >
            ◀ 返回
          </button>

          <div className="w-px h-5 bg-honey-600" />

          <span className="text-xl">🐝</span>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-sm text-honey-300 truncate">
              {research.title}
            </h1>
            <p className="text-[9px] text-honey-500/60 truncate">
              {research.objective}
            </p>
          </div>

          {isProcessing && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-honey-800 border border-honey-500">
                <motion.div
                  className="w-2 h-2 bg-honey-400"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
                <span className="text-[10px] text-honey-300">搜索中</span>
              </div>
              <button
                onClick={handleStop}
                className="pixel-btn px-3 py-1 bg-red-500 text-white text-[10px] font-bold"
                title="停止研究"
              >
                ■ 停止
              </button>
            </div>
          )}

          <div className="flex gap-1 ml-2">
            <button
              onClick={() => setRightPanel("content")}
              className={`pixel-btn px-2.5 py-1 text-[10px] ${
                rightPanel === "content"
                  ? "bg-honey-400 text-bee-dark font-bold"
                  : "bg-honey-800 text-honey-500"
              }`}
            >
              📊 研究
            </button>
            <button
              onClick={() => setRightPanel("flowers")}
              className={`pixel-btn px-2.5 py-1 text-[10px] ${
                rightPanel === "flowers"
                  ? "bg-honey-400 text-bee-dark font-bold"
                  : "bg-honey-800 text-honey-500"
              }`}
            >
              🌸 花田
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-[420px] flex-shrink-0 border-r-3 border-bee-dark bg-white/60">
          <ChatPanel messages={research.messages} onSend={handleSend} onStop={handleStop} isProcessing={isProcessing} />
        </div>
        <div className="flex-1 bg-honey-50/80">
          {rightPanel === "content" ? (
            <ContentPanel
              bees={research.bees}
              graph={research.graph}
              report={research.report}
              status={research.status}
            />
          ) : (
            <FlowerFieldPanel />
          )}
        </div>
      </div>
    </div>
  );
}
